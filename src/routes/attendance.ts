import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest, requireRole, authenticateKioskToken, KioskAuthenticatedRequest } from '../middleware/auth';
import { generateQrHmac, verifyQrHmac } from '../utils/qr';
import { calculateAttendanceStatus, getISTComponents } from '../utils/time';
import { Roles, LateProposalSchema } from '@rrh-ems/shared';
import { validateRequestBody } from '../middleware/validate';

const router = Router();

const p = prisma;

// Kiosk scanner type — not yet in @rrh-ems/shared; defined locally to avoid a circular dep.
export type ScannerType = 'KIOSK' | 'EMPLOYEE_DEVICE';

// GET /api/v1/attendance/my-qr - Generate personal HMAC QR payload
router.get('/my-qr', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const employeeCode = req.user!.employeeCode;
    const version = 1;
    const signedToken = generateQrHmac(employeeId, employeeCode, version);

    // Get latest active QR record or create new
    let qrRecord = await p.employeeQrCode.findFirst({
      where: { employee_id: employeeId },
      orderBy: { generated_at: 'desc' },
    });

    if (!qrRecord) {
      qrRecord = await p.employeeQrCode.create({
        data: {
          employee_id: employeeId,
          qr_token: signedToken,
        },
      });
    }

    return res.status(200).json({
      employeeId,
      employeeCode,
      version,
      signedToken,
      qrData: JSON.stringify({ employeeId, employeeCode, version, signedToken }),
    });
  } catch (error) {
    console.error('QR fetch error:', error);
    return res.status(500).json({ error: 'Failed to generate QR token' });
  }
});

// GET /api/v1/attendance/my-status - Check today's check-in status
router.get('/my-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const { dateString } = getISTComponents(new Date());

    // Find attendance log for today IST
    const logs = await p.attendanceLog.findMany({
      where: { employee_id: employeeId },
      orderBy: { check_in_at: 'desc' },
      take: 5,
    });

    const todayLog = logs.find((l: any) => {
      if (!l.check_in_at) return false;
      return getISTComponents(new Date(l.check_in_at)).dateString === dateString;
    });

    return res.status(200).json({
      date: dateString,
      checkedIn: !!todayLog,
      status: todayLog ? todayLog.status : null,
      checkInAt: todayLog?.check_in_at || null,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch attendance status' });
  }
});

// Helper to parse and verify payload
const parseAndVerifyQR = (req: AuthenticatedRequest, qrPayload: any) => {
  let payload = qrPayload;
  if (typeof qrPayload === 'string') {
    try {
      payload = JSON.parse(qrPayload);
    } catch (e) {}
  }

  if (!payload || !payload.employeeId) return null;

  const isValid = verifyQrHmac(
    payload.employeeId,
    payload.employeeCode,
    payload.version || 1,
    payload.signedToken || payload,
  );

  return isValid ? payload : null;
};

// POST /api/v1/attendance/scan - Verify QR and Stamp Attendance (IST rules)
// Kiosk-only: must be authenticated with a type:'KIOSK' token.
// The token's embedded branchId is written to AttendanceLog.branch_id so the
// attendance record carries the physical scan location, not the employee's
// assigned branch.
router.post('/scan', authenticateKioskToken, async (req: KioskAuthenticatedRequest, res: Response) => {
  const targetCompanyId = req.kiosk!.companyId;
  const branchId = req.kiosk!.branchId; // physical scan location

  try {
    const payload = parseAndVerifyQR(req, req.body.qrPayload);
    if (!payload) return res.status(400).json({ error: 'Invalid or forged QR Code token' });

    const targetEmployeeId = payload.employeeId;

    // Load employee and verify Tenant Isolation & Status
    const scannedEmployee = await p.employee.findUnique({
      where: { id: targetEmployeeId },
    });

    if (!scannedEmployee) return res.status(404).json({ error: 'Employee not found' });
    if (scannedEmployee.company_id !== targetCompanyId) {
      return res.status(403).json({ error: 'Employee does not belong to your company' });
    }
    if (scannedEmployee.status !== 'ACTIVE' || !scannedEmployee.attendance_required) {
      return res.status(403).json({ error: 'Employee is not eligible for attendance' });
    }

    const now = new Date();
    const { dateString, timeString } = getISTComponents(now);

    // Concurrency Protection via Transaction
    const result = await p.$transaction(
      async (tx: import('@prisma/client').Prisma.TransactionClient) => {
        const existingLogs = await tx.attendanceLog.findMany({
          where: { employee_id: targetEmployeeId },
          orderBy: { check_in_at: 'desc' },
          take: 5,
        });

        const activeCheckIn = existingLogs.find((l: any) => l.check_out_at === null);
        if (activeCheckIn) return { alreadyStamped: true, log: activeCheckIn };

        const alreadyCheckedInToday = existingLogs.find((l: any) => {
          if (!l.check_in_at) return false;
          return getISTComponents(new Date(l.check_in_at)).dateString === dateString;
        });

        if (alreadyCheckedInToday) return { alreadyStamped: true, log: alreadyCheckedInToday };

        // Check for an approved late-checkin proposal covering today (IST)
        const istTodayStart = new Date(`${dateString}T00:00:00+05:30`);
        const istTodayEnd   = new Date(`${dateString}T23:59:59+05:30`);
        const approvedProposal = await tx.attendanceProposal.findFirst({
          where: {
            employee_id: targetEmployeeId,
            type: 'LATE_CHECKIN',
            status: 'APPROVED',
            target_date: { gte: istTodayStart, lte: istTodayEnd },
          },
        });
        const hasApprovedProposal = !!approvedProposal;

        const calculatedStatus = calculateAttendanceStatus(now, hasApprovedProposal, scannedEmployee.employment_type || 'FULL_TIME');
        const newLog = await tx.attendanceLog.create({
          data: {
            employee_id: targetEmployeeId,
            check_in_at: now,
            status: calculatedStatus,
            source: 'QR_SCAN',
            ...(branchId != null ? { branch_id: branchId } : {}), // populate only for kiosk scans
          },
        });
        return { alreadyStamped: false, log: newLog };
      },
      { isolationLevel: 'Serializable' },
    );

    if (result.alreadyStamped) {
      return res.status(200).json({
        message: 'Already checked in for today',
        alreadyStamped: true,
        status: result.log?.status,
        checkInAt: result.log?.check_in_at,
        timeIST: timeString,
      });
    }

    return res.status(200).json({
      message: `Attendance stamped successfully as ${result.log?.status}`,
      alreadyStamped: false,
      status: result.log?.status,
      checkInAt: result.log?.check_in_at,
      timeIST: timeString,
    });
  } catch (error: any) {
    if (error.code === 'P2034') {
      // Transaction conflict / deadlock. Another request won the race.
      // We can safely assume they are already checked in.
      return res.status(200).json({
        message: 'Already checked in (handled concurrent request)',
        alreadyStamped: true,
        status: 'PRESENT',
        timeIST: getISTComponents(new Date()).timeString,
      });
    }
    console.error('Scan attendance error:', error);
    return res.status(500).json({ error: 'Attendance scan verification failed' });
  }
});

// POST /api/v1/attendance/checkout - Verify QR and Stamp Checkout
// Kiosk-only: must be authenticated with a type:'KIOSK' token.
// branch_id from the kiosk token is written to AttendanceLog so the checkout
// record carries the physical scan location.
router.post('/checkout', authenticateKioskToken, async (req: KioskAuthenticatedRequest, res: Response) => {
  const targetCompanyId = req.kiosk!.companyId;
  const branchId = req.kiosk!.branchId;

  try {
    const payload = parseAndVerifyQR(req, req.body.qrPayload);
    if (!payload) return res.status(400).json({ error: 'Invalid or forged QR Code token' });

    const targetEmployeeId = payload.employeeId;

    const scannedEmployee = await p.employee.findUnique({ where: { id: targetEmployeeId } });
    if (!scannedEmployee || scannedEmployee.company_id !== targetCompanyId) {
      return res.status(403).json({ error: 'Employee does not belong to your company' });
    }

    const now = new Date();
    const { dateString, timeString } = getISTComponents(now);

    // Kiosk logout gate: employees with report_required=true must submit today's
    // daily report before checking out. Reuses the same lookup logic as GET /reports/today-status.
    if (scannedEmployee.report_required) {
      const todayReport = await p.dailyReport.findFirst({
        where: {
          employee_id: targetEmployeeId,
          submitted_at: {
            gte: new Date(`${dateString}T00:00:00.000Z`),
            lte: new Date(`${dateString}T23:59:59.999Z`),
          },
        },
      });
      if (!todayReport) {
        return res.status(400).json({
          error: "Please submit today's daily report before logging out. Go to your account, submit the report, then come back and scan out.",
        });
      }
    }

    const result = await p.$transaction(
      async (tx: import('@prisma/client').Prisma.TransactionClient) => {
        // Find active check-in
        const activeLog = await tx.attendanceLog.findFirst({
          where: { employee_id: targetEmployeeId, check_out_at: null },
          orderBy: { check_in_at: 'desc' },
        });

        if (!activeLog) return { error: 'No active check-in found for today' };

        const checkInTime = new Date(activeLog.check_in_at).getTime();
        const diffMs = now.getTime() - checkInTime;
        const durationMinutes = Math.max(0, Math.round(diffMs / 60000));

        const updatedLog = await tx.attendanceLog.update({
          where: { id: activeLog.id },
          data: {
            check_out_at: now,
            working_duration_minutes: durationMinutes,
            ...(branchId != null ? { branch_id: branchId } : {}), // populate only for kiosk scans
          },
        });

        return { log: updatedLog };
      },
      { isolationLevel: 'Serializable' },
    );

    if (result.error) return res.status(400).json({ error: result.error });

    return res.status(200).json({
      message: 'Checked out successfully',
      checkOutAt: result.log?.check_out_at,
      working_duration_minutes: result.log?.working_duration_minutes,
      timeIST: timeString,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Attendance checkout failed' });
  }
});

// POST /api/v1/attendance/late-proposal - Submit late proposal (< 09:30 AM IST)
router.post(
  '/late-proposal',
  authenticateToken,
  validateRequestBody(LateProposalSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { hours, minutes } = getISTComponents(new Date());
      const currentMinutes = hours * 60 + minutes;
      const cutoff930 = 9 * 60 + 30; // 09:30 AM

      if (currentMinutes > cutoff930) {
        return res.status(400).json({
          error: 'Late proposals must be submitted before 09:30 AM IST on the same day.',
        });
      }

      // Record proposal in AttendanceProposal table
      const proposal = await p.attendanceProposal.create({
        data: {
          employee_id: req.user!.employeeId,
          type: 'LATE_CHECKIN',
          target_date: new Date(`${req.body.date}T${req.body.expected_time}:00+05:30`),
          reason: req.body.reason,
          status: 'PENDING',
        },
      });

      // Write AuditEvent so the HR approval queue (GET /attendance/proposals/queue)
      // can surface this submission — queue filters on action: 'SUBMIT_LATE_PROPOSAL'
      await p.auditEvent.create({
        data: {
          actor_id: req.user!.employeeId,
          action: 'SUBMIT_LATE_PROPOSAL',
          entity_type: 'ATTENDANCE_PROPOSAL',
          entity_id: proposal.id,
          new_value: JSON.stringify({ type: 'LATE_CHECKIN', target_date: proposal.target_date, reason: req.body.reason }),
        },
      });

      return res.status(201).json({
        message: 'Late proposal submitted successfully to HR queue',
        proposalId: proposal.id,
      });
    } catch (error: any) {
      console.error('Late proposal error:', error);
      return res
        .status(500)
        .json({ error: 'Failed to submit late proposal', detail: error?.message });
    }
  },
);

// GET /api/v1/attendance/proposals/queue - HR Manager approval queue
router.get(
  '/proposals/queue',
  authenticateToken,
  requireRole([Roles.HR_MANAGER, Roles.MD]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyEmployees = await p.employee.findMany({
        where: { company_id: req.user!.companyId },
        select: { id: true },
      });

      const proposals = await p.auditEvent.findMany({
        where: {
          action: 'SUBMIT_LATE_PROPOSAL',
          actor_id: { in: companyEmployees.map((e: any) => e.id) },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      });

      return res.status(200).json({ proposals });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to load HR proposal queue' });
    }
  },
);

// GET /api/v1/attendance/live - HR Live Attendance Feed (Today only)
router.get(
  '/live',
  authenticateToken,
  requireRole([Roles.HR_MANAGER, Roles.MD, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { dateString } = getISTComponents(new Date());

      // Fetch all attendance logs that occurred today
      const allLogs = await p.attendanceLog.findMany({
        where: { employee: { company_id: req.user!.companyId } },
        orderBy: { check_in_at: 'desc' },
        include: {
          employee: {
            select: {
              full_name: true,
              employee_code: true,
            },
          },
        },
      });

      // Filter for today in IST
      const todayLogs = allLogs.filter((l: any) => {
        if (!l.check_in_at) return false;
        return getISTComponents(new Date(l.check_in_at)).dateString === dateString;
      });

      return res.status(200).json({ logs: todayLogs });
    } catch (error) {
      console.error('Live attendance error:', error);
      return res.status(500).json({ error: 'Failed to load live attendance' });
    }
  },
);

// GET /api/v1/attendance/history - HR Paginated Historical Attendance
router.get(
  '/history',
  authenticateToken,
  requireRole([Roles.HR_MANAGER, Roles.MD, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, status, startDate, endDate, page = '1', limit = '50' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {
        employee: {
          company_id: req.user!.companyId,
          ...(search && {
            OR: [
              { full_name: { contains: search as string } },
              { employee_code: { contains: search as string } },
            ],
          }),
        },
      };

      if (status) {
        whereClause.status = status;
      }

      if (startDate || endDate) {
        whereClause.check_in_at = {};
        if (startDate) whereClause.check_in_at.gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          whereClause.check_in_at.lte = end;
        }
      }

      const [logs, total] = await Promise.all([
        p.attendanceLog.findMany({
          where: whereClause,
          orderBy: { check_in_at: 'desc' },
          skip,
          take: Number(limit),
          include: {
            employee: {
              select: {
                full_name: true,
                employee_code: true,
              },
            },
          },
        }),
        p.attendanceLog.count({ where: whereClause }),
      ]);

      return res.status(200).json({
        logs,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('History attendance error:', error);
      return res.status(500).json({ error: 'Failed to load attendance history' });
    }
  },
);

export default router;
