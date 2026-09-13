import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import storageService from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

export const logExternalPayment = async (req: Request, res: Response) => {
  try {
    const { installmentId, amount, paymentMethod, referenceNumber, date } = req.body;
    const employeeId = req.user!.id;

    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { emiSchedule: { include: { property: true } } },
    });
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    // STRICT RULE: DEM payments ALWAYS start as Pending Verification.
    // They NEVER process real-time transactions.
    const payment = await prisma.payment.create({
      data: {
        installmentId,
        amount: Number(amount),
        paymentMethod,
        referenceNumber,
        verificationStatus: 'Pending Verification',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: employeeId,
        actionType: 'CREATE',
        entity: 'Payment',
        entityId: payment.id,
        newValue: JSON.stringify({ amount, status: 'Pending Verification' }),
      },
    });

    const projectId = installment.emiSchedule?.property?.projectId;
    if (projectId) {
      await NotificationService.notifyEmployeesByRole(
        'PM',
        'PAYMENT_ENTERED',
        'Payment Awaiting Verification',
        `A payment of ₹${amount} was entered and requires verification.`,
        projectId,
      );
    }

    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to log external payment' });
  }
};

export const uploadPaymentProof = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { safeFilename, path: destPath } = await storageService.uploadFile(req.file);

    const proof = await prisma.paymentProof.create({
      data: {
        paymentId,
        documentUrl: `/api/v1/documents/stream/${safeFilename}`, // We'll serve this via document controller
        originalFilename: req.file.originalname,
        safeFilename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user!.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actionType: 'CREATE',
        entity: 'PaymentProof',
        entityId: proof.id,
        newValue: safeFilename,
      },
    });

    res.json(proof);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to upload payment proof' });
  }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { installmentId, status, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const whereClause: any = { installmentId: installmentId as string };
    if (status) whereClause.verificationStatus = status as string;

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: { paymentProof: true, installment: { include: { emiSchedule: true } } },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: parseInt(limit as string),
    });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve payment history' });
  }
};
