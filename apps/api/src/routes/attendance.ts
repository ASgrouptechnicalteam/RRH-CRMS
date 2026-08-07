import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { generateQrHmac, verifyQrHmac } from '../utils/qr';
import { calculateAttendanceStatus, getISTComponents } from '../utils/time';
import { Roles, LateProposalSchema } from '@rrh-ems/shared';
import { validateRequestBody } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

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

// POST /api/v1/attendance/scan - Verify QR and Stamp Attendance (IST rules)
router.post('/scan', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const { qrPayload } = req.body;

    let payload = qrPayload;
    if (typeof qrPayload === 'string') {
      try {
        payload = JSON.parse(qrPayload);
      } catch (e) {
        // Raw string passed
      }
    }

    // Verify QR HMAC signature
    const isValid = verifyQrHmac(
      payload?.employeeId || employeeId,
      payload?.employeeCode || req.user!.employeeCode,
      payload?.version || 1,
      payload?.signedToken || payload
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or forged QR Code token' });
    }

    const now = new Date();
    const { dateString, timeString } = getISTComponents(now);

    // Check if already checked in today
    const existingLogs = await p.attendanceLog.findMany({
      where: { employee_id: employeeId },
      orderBy: { check_in_at: 'desc' },
      take: 5,
    });

    const alreadyCheckedIn = existingLogs.find((l: any) => {
      if (!l.check_in_at) return false;
      return getISTComponents(new Date(l.check_in_at)).dateString === dateString;
    });

    if (alreadyCheckedIn) {
      return res.status(200).json({
        message: 'Already checked in for today',
        alreadyStamped: true,
        status: alreadyCheckedIn.status,
        checkInAt: alreadyCheckedIn.check_in_at,
        timeIST: timeString,
      });
    }

    const hasApprovedProposal = false;
    const calculatedStatus = calculateAttendanceStatus(now, hasApprovedProposal);

    const log = await p.attendanceLog.create({
      data: {
        employee_id: employeeId,
        check_in_at: now,
        status: calculatedStatus,
        source: 'QR_SCAN',
      },
    });

    return res.status(200).json({
      message: `Attendance stamped successfully as ${log.status}`,
      alreadyStamped: false,
      status: log.status,
      checkInAt: log.check_in_at,
      timeIST: timeString,
    });
  } catch (error) {
    console.error('Scan attendance error:', error);
    return res.status(500).json({ error: 'Attendance scan verification failed' });
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

      return res.status(201).json({
        message: 'Late proposal submitted successfully to HR queue',
        proposalId: proposal.id,
      });
    } catch (error: any) {
      console.error('Late proposal error:', error);
      return res.status(500).json({ error: 'Failed to submit late proposal', detail: error?.message });
    }
  }
);

// GET /api/v1/attendance/proposals/queue - HR Manager approval queue
router.get(
  '/proposals/queue',
  authenticateToken,
  requireRole([Roles.HR_MANAGER, Roles.MD]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const proposals = await p.auditEvent.findMany({
        where: {
          action: 'SUBMIT_LATE_PROPOSAL',
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      });

      return res.status(200).json({ proposals });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to load HR proposal queue' });
    }
  }
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
        orderBy: { check_in_at: 'desc' },
        include: {
          employee: {
            select: {
              first_name: true,
              last_name: true,
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
  }
);

export default router;
