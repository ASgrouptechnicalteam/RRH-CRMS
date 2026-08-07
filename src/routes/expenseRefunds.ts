/**
 * expenseRefunds.ts
 * 
 * Petty Cash / Expense Reimbursement workflow.
 * 
 * Status lifecycle:
 *   PENDING → ACCOUNTANT_APPROVED → MD_APPROVED → REFUNDED
 *         ↘ REJECTED_BY_ACCOUNTANT
 *                          ↘ REJECTED_BY_MD
 */

import { Router, Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Roles } from '@rrh-ems/shared';
import { notifyEmployee } from '../utils/notifyEmployee';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// Configure multer for bill/proof image uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'expense-proofs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPG, PNG, WebP) and PDFs are allowed.'));
    }
  },
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/expense-refunds/my — Employee's own submissions
// ─────────────────────────────────────────────────────────────
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const refunds = await p.expenseRefund.findMany({
      where: { employee_id: employeeId },
      orderBy: { created_at: 'desc' },
    });
    return res.status(200).json({ refunds });
  } catch (error) {
    console.error('[ExpenseRefunds] GET /my error:', error);
    return res.status(500).json({ error: 'Failed to fetch your refund requests.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/expense-refunds/queue — Pending queue for accountant/MD
// ─────────────────────────────────────────────────────────────
router.get(
  '/queue',
  authenticateToken,
  requireRole([Roles.FINANCE, Roles.MD, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const roles = req.user!.roles || [];
      const isMD = roles.includes(Roles.MD);

      // MD sees ACCOUNTANT_APPROVED items; Accountant sees PENDING and MD_APPROVED
      const statusFilter = isMD
        ? { status: 'ACCOUNTANT_APPROVED' }
        : { status: { in: ['PENDING', 'MD_APPROVED'] } };

      const refunds = await p.expenseRefund.findMany({
        where: statusFilter,
        orderBy: { created_at: 'asc' },
        include: {
          employee: {
            select: { id: true, full_name: true, employee_code: true, department: true },
          },
        },
      });
      return res.status(200).json({ refunds });
    } catch (error) {
      console.error('[ExpenseRefunds] GET /queue error:', error);
      return res.status(500).json({ error: 'Failed to fetch refund queue.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/v1/expense-refunds — Submit a new request (any employee)
// ─────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticateToken,
  upload.single('proof_image'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const employeeId = req.user!.employeeId;
      const { purpose, amount } = req.body;

      if (!purpose || !amount) {
        return res.status(400).json({ error: 'Purpose and amount are required.' });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number.' });
      }

      // Get employee's company_id
      const employee = await p.employee.findUnique({
        where: { id: employeeId },
        select: { company_id: true },
      });

      const proofImageUrl = req.file
        ? `/uploads/expense-proofs/${req.file.filename}`
        : null;

      const refund = await p.expenseRefund.create({
        data: {
          employee_id: employeeId,
          company_id: employee.company_id,
          purpose,
          amount: amountNum,
          proof_image_url: proofImageUrl,
          status: 'PENDING',
        },
      });

      // Notify all Finance/Accountant employees
      const accountants = await p.employee.findMany({
        where: {
          roles: { some: { role: { name: Roles.FINANCE } } },
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      const accountantIds = accountants.map((a: any) => a.id);
      if (accountantIds.length > 0) {
        await notifyEmployee(accountantIds, {
          type: 'EXPENSE_REFUND_SUBMITTED',
          title: '💰 New Expense Refund Request',
          message: `A new refund of ₹${amountNum.toLocaleString('en-IN')} has been submitted for review. Purpose: ${purpose}`,
          link: '/finance',
        });
      }

      return res.status(201).json({ message: 'Refund request submitted.', refund });
    } catch (error) {
      console.error('[ExpenseRefunds] POST / error:', error);
      return res.status(500).json({ error: 'Failed to submit refund request.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/expense-refunds/:id/accountant-review
// Accountant: PENDING → ACCOUNTANT_APPROVED or REJECTED_BY_ACCOUNTANT
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/accountant-review',
  authenticateToken,
  requireRole([Roles.FINANCE, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const accountantId = req.user!.employeeId;
      const { decision, note } = req.body; // decision: 'APPROVE' | 'REJECT'

      if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
        return res.status(400).json({ error: 'Decision must be APPROVE or REJECT.' });
      }

      const refund = await p.expenseRefund.findUnique({ where: { id } });
      if (!refund) return res.status(404).json({ error: 'Refund request not found.' });
      if (refund.status !== 'PENDING') {
        return res.status(400).json({ error: `Cannot review a request with status "${refund.status}".` });
      }

      const newStatus = decision === 'APPROVE' ? 'ACCOUNTANT_APPROVED' : 'REJECTED_BY_ACCOUNTANT';

      const updated = await p.expenseRefund.update({
        where: { id },
        data: {
          status: newStatus,
          accountant_id: accountantId,
          accountant_note: note || null,
          accountant_reviewed_at: new Date(),
        },
      });

      if (decision === 'APPROVE') {
        // Notify MD for final approval
        const mds = await p.employee.findMany({
          where: { roles: { some: { role: { name: Roles.MD } } }, status: 'ACTIVE' },
          select: { id: true },
        });
        if (mds.length > 0) {
          await notifyEmployee(mds.map((m: any) => m.id), {
            type: 'EXPENSE_REFUND_AWAITING_MD',
            title: '📋 Expense Refund Awaits Your Approval',
            message: `A refund of ₹${refund.amount.toLocaleString('en-IN')} has been verified by the accountant and needs your approval.`,
            link: '/finance',
          });
        }
      } else {
        // Notify employee of rejection
        await notifyEmployee(refund.employee_id, {
          type: 'EXPENSE_REFUND_REJECTED',
          title: '❌ Expense Refund Rejected',
          message: `Your refund request of ₹${refund.amount.toLocaleString('en-IN')} was rejected by the accountant.${note ? ` Reason: ${note}` : ''}`,
          link: '/finance',
        });
      }

      return res.status(200).json({ message: 'Review recorded.', refund: updated });
    } catch (error) {
      console.error('[ExpenseRefunds] PATCH accountant-review error:', error);
      return res.status(500).json({ error: 'Failed to process accountant review.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/expense-refunds/:id/md-review
// MD: ACCOUNTANT_APPROVED → MD_APPROVED or REJECTED_BY_MD
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/md-review',
  authenticateToken,
  requireRole([Roles.MD, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const mdId = req.user!.employeeId;
      const { decision, note } = req.body;

      if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
        return res.status(400).json({ error: 'Decision must be APPROVE or REJECT.' });
      }

      const refund = await p.expenseRefund.findUnique({ where: { id } });
      if (!refund) return res.status(404).json({ error: 'Refund request not found.' });
      if (refund.status !== 'ACCOUNTANT_APPROVED') {
        return res.status(400).json({ error: `Cannot MD-review a request with status "${refund.status}".` });
      }

      const newStatus = decision === 'APPROVE' ? 'MD_APPROVED' : 'REJECTED_BY_MD';

      const updated = await p.expenseRefund.update({
        where: { id },
        data: {
          status: newStatus,
          md_id: mdId,
          md_note: note || null,
          md_reviewed_at: new Date(),
        },
      });

      if (decision === 'APPROVE') {
        // Notify employee + accountant to process the refund
        const accountantsToNotify: number[] = [];
        if (refund.accountant_id) accountantsToNotify.push(refund.accountant_id);

        await notifyEmployee(refund.employee_id, {
          type: 'EXPENSE_REFUND_MD_APPROVED',
          title: '✅ MD Approved Your Refund!',
          message: `Your expense refund of ₹${refund.amount.toLocaleString('en-IN')} has been approved by the MD. The Finance team will process the payment shortly.`,
          link: '/finance',
        });

        if (accountantsToNotify.length > 0) {
          await notifyEmployee(accountantsToNotify, {
            type: 'EXPENSE_REFUND_PROCESS_PAYMENT',
            title: '💳 Please Process Refund Payment',
            message: `MD has approved a refund of ₹${refund.amount.toLocaleString('en-IN')}. Please process the payment and mark it as refunded.`,
            link: '/finance',
          });
        }
      } else {
        // Notify employee of MD rejection
        await notifyEmployee(refund.employee_id, {
          type: 'EXPENSE_REFUND_REJECTED',
          title: '❌ Expense Refund Rejected by MD',
          message: `Your refund request of ₹${refund.amount.toLocaleString('en-IN')} was not approved.${note ? ` Reason: ${note}` : ''}`,
          link: '/finance',
        });
      }

      return res.status(200).json({ message: 'MD review recorded.', refund: updated });
    } catch (error) {
      console.error('[ExpenseRefunds] PATCH md-review error:', error);
      return res.status(500).json({ error: 'Failed to process MD review.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/expense-refunds/:id/mark-refunded
// Accountant marks as physically refunded
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/mark-refunded',
  authenticateToken,
  requireRole([Roles.FINANCE, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const accountantId = req.user!.employeeId;

      const refund = await p.expenseRefund.findUnique({ where: { id } });
      if (!refund) return res.status(404).json({ error: 'Refund request not found.' });
      if (refund.status !== 'MD_APPROVED') {
        return res.status(400).json({ error: `Can only mark MD-approved refunds as refunded. Current status: "${refund.status}".` });
      }

      const updated = await p.expenseRefund.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          refunded_at: new Date(),
          refunded_by: accountantId,
        },
      });

      // Notify employee
      await notifyEmployee(refund.employee_id, {
        type: 'EXPENSE_REFUNDED',
        title: '🎉 Your Expense Has Been Refunded!',
        message: `₹${refund.amount.toLocaleString('en-IN')} has been refunded to you. Please collect it from the Finance department.`,
        link: '/finance',
      });

      return res.status(200).json({ message: 'Marked as refunded.', refund: updated });
    } catch (error) {
      console.error('[ExpenseRefunds] PATCH mark-refunded error:', error);
      return res.status(500).json({ error: 'Failed to mark refund as paid.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// GET /api/v1/expense-refunds/:id/proof — View bill image (auth required)
// ─────────────────────────────────────────────────────────────
router.get(
  '/:id/proof',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const requesterId = req.user!.employeeId;
      const roles = req.user!.roles || [];
      const canViewAll = roles.some(r => [Roles.FINANCE, Roles.MD, Roles.ADMIN].includes(r as any));

      const refund = await p.expenseRefund.findUnique({ where: { id } });
      if (!refund) return res.status(404).json({ error: 'Refund not found.' });

      // Only the submitter or Finance/MD/Admin can view the proof
      if (!canViewAll && refund.employee_id !== requesterId) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      if (!refund.proof_image_url) {
        return res.status(404).json({ error: 'No proof image attached to this request.' });
      }

      const filePath = path.join(process.cwd(), refund.proof_image_url);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Proof image file not found on server.' });
      }

      return res.sendFile(filePath);
    } catch (error) {
      console.error('[ExpenseRefunds] GET /proof error:', error);
      return res.status(500).json({ error: 'Failed to retrieve proof image.' });
    }
  }
);

export default router;
