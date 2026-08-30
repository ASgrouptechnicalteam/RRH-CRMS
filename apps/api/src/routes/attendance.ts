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

// POST /api/v1/attendance/scan - Verify QR and Stamp Attendance (Unified Auto-Detect)
// Kiosk-only: must be authenticated with a type:'KIOSK' token.
// The token's embedded branchId is written to AttendanceLog.branch_id so the
// attendance record carries the physical scan location.

const scanDebounceMap = new Map<number, number>();
const DEBOUNCE_MS = 10000;

router.post('/scan', authenticateKioskToken, async (req: KioskAuthenticatedRequest, res: Response) => {
  const targetCompanyId = req.kiosk!.companyId;
  const branchId = req.kiosk!.branchId;

  try {
    const payload = parseAndVerifyQR(req, req.body.qrPayload);
    if (!payload) return res.status(400).json({ error: 'Invalid or forged QR Code token' });

    const targetEmployeeId = payload.employeeId;

    // Debounce check
    const lastScanTime = scanDebounceMap.get(targetEmployeeId);
    const nowTime = Date.now();
    if (lastScanTime && nowTime - lastScanTime < DEBOUNCE_MS) {
      return res.status(429).json({ error: 'Please wait 10 seconds before scanning again' });
    }
    scanDebounceMap.set(targetEmployeeId, nowTime);

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

    const result = await p.$transaction(
      async (tx: import('@prisma/client').Prisma.TransactionClient) => {
        // Fetch all logs for this employee for TODAY (IST)
        const istTodayStart = new Date(`${dateString}T00:00:00+05:30`);
        const istTodayEnd   = new Date(`${dateString}T23:59:59+05:30`);
        
        const todayLogs = await tx.attendanceLog.findMany({
          where: { 
            employee_id: targetEmployeeId,
            check_in_at: { gte: istTodayStart, lte: istTodayEnd }
          },
          orderBy: { check_in_at: 'desc' },
        });

        const activeCheckIn = todayLogs.find((l: any) => l.check_out_at === null);
        
        if (activeCheckIn) {
          // --- CHECK-OUT LOGIC ---
          // Kiosk logout gate: daily report check
          if (scannedEmployee.report_required) {
            const todayReport = await tx.dailyReport.findFirst({
              where: {
                employee_id: targetEmployeeId,
                submitted_at: {
                  gte: istTodayStart,
                  lte: istTodayEnd,
                },
              },
            });
            if (!todayReport) {
              return { error: "Please submit today's daily report before logging out. Go to your account, submit the report, then come back and scan out." };
            }
          }

          const checkInTime = new Date(activeCheckIn.check_in_at).getTime();
          const diffMs = now.getTime() - checkInTime;
          const durationMinutes = Math.max(0, Math.round(diffMs / 60000));

          const updatedLog = await tx.attendanceLog.update({
            where: { id: activeCheckIn.id },
            data: {
              check_out_at: now,
              working_duration_minutes: durationMinutes,
              ...(branchId != null ? { checkout_branch_id: branchId } : {}),
            },
          });

          return { action: 'CHECK_OUT', log: updatedLog };
        } else {
          // --- CHECK-IN LOGIC ---
          // Check if there is already a completed log for today
          if (todayLogs.length > 0) {
             return { error: "Attendance already completed for today" };
          }

          // Check for an approved late-checkin proposal covering today (IST)
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
              ...(branchId != null ? { branch_id: branchId } : {}),
            },
          });
          return { action: 'CHECK_IN', log: newLog };
        }
      },
      { isolationLevel: 'Serializable' }
    );

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({
      message: `Attendance stamped successfully`,
      action: result.action,
      status: result.log?.status,
      checkInAt: result.log?.check_in_at,
      checkOutAt: result.log?.check_out_at,
      timeIST: timeString,
      employeeName: scannedEmployee.full_name,
    });
  } catch (error: any) {
    if (error.code === 'P2034') {
      return res.status(400).json({
        error: 'Concurrency error processing attendance. Please try again.'
      });
    }
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

      // Fetch all branches for mapping
      const branches = await p.branch.findMany({
        where: { company_id: req.user!.companyId },
        select: { id: true, name: true }
      });
      const branchMap = new Map(branches.map(b => [b.id, b.name]));

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

      const todayLogs = allLogs.filter((l: any) => {
        if (!l.check_in_at) return false;
        return getISTComponents(new Date(l.check_in_at)).dateString === dateString;
      }).map((log: any) => ({
        ...log,
        branch_name: log.branch_id ? branchMap.get(log.branch_id) || 'Unknown' : null,
        checkout_branch_name: log.checkout_branch_id ? branchMap.get(log.checkout_branch_id) || 'Unknown' : null,
        isCrossBranch: log.branch_id !== null && log.checkout_branch_id !== null && log.branch_id !== log.checkout_branch_id,
      }));

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

      // Fetch branches for mapping
      const branches = await p.branch.findMany({
        where: { company_id: req.user!.companyId },
        select: { id: true, name: true }
      });
      const branchMap = new Map(branches.map(b => [b.id, b.name]));

      const [rawLogs, total] = await Promise.all([
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

      const logs = rawLogs.map((log: any) => ({
        ...log,
        branch_name: log.branch_id ? branchMap.get(log.branch_id) || 'Unknown' : null,
        checkout_branch_name: log.checkout_branch_id ? branchMap.get(log.checkout_branch_id) || 'Unknown' : null,
        isCrossBranch: log.branch_id !== null && log.checkout_branch_id !== null && log.branch_id !== log.checkout_branch_id,
      }));

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

// POST /api/v1/attendance/manual-correction
router.post(
  '/manual-correction',
  authenticateToken,
  requireRole([Roles.HR_MANAGER, Roles.MD, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { employeeId, date, status, reason } = req.body;

      if (!employeeId || !date || !status || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (reason.length < 10) {
        return res.status(400).json({ error: 'Reason must be at least 10 characters long' });
      }

      if (status !== 'ABSENT' && status !== 'LATE') {
        return res.status(400).json({ error: 'Status must be ABSENT or LATE' });
      }

      const correctionDate = new Date(date);
      const now = new Date();
      if (correctionDate > now) {
        return res.status(400).json({ error: 'Cannot correct attendance for future dates' });
      }

      // Ensure the target employee exists
      const targetEmployee = await p.employee.findUnique({
        where: { id: Number(employeeId) },
      });

      if (!targetEmployee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const { dateString: correctionDateString } = getISTComponents(correctionDate);

      // Check if there is already a KIOSK scan for this date
      const existingLogs = await p.attendanceLog.findMany({
        where: { employee_id: Number(employeeId) },
      });

      const hasKioskScan = existingLogs.some((l: any) => {
        if (l.source !== 'KIOSK') return false;
        return getISTComponents(new Date(l.check_in_at)).dateString === correctionDateString;
      });

      if (hasKioskScan) {
        return res.status(409).json({ error: 'Cannot overwrite a real KIOSK scan' });
      }

      // Create new manual log
      // We set check_in_at to 09:00 IST of that date
      const checkInAt = new Date(`${date}T09:00:00.000+05:30`);

      const newLog = await p.attendanceLog.create({
        data: {
          employee_id: Number(employeeId),
          check_in_at: checkInAt,
          status,
          source: 'HR_MANUAL',
          reason,
          created_by_id: req.user!.employeeId,
        }
      });

      return res.status(201).json({ success: true, log: newLog });
    } catch (error) {
      console.error('Manual correction error:', error);
      return res.status(500).json({ error: 'Failed to process manual correction' });
    }
  }
);

// PUT /api/v1/attendance/:id/override - HR Manual Attendance Correction
router.put(
  '/:id/override',
  authenticateToken,
  requireRole([Roles.HR_MANAGER, Roles.MD, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const logId = parseInt(req.params.id, 10);
      const { check_in_at, check_out_at, status, reason } = req.body;

      if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'A specific reason is required for manual overrides.' });
      }

      // Verify log exists and belongs to the admin's company
      const existingLog = await p.attendanceLog.findUnique({
        where: { id: logId },
        include: { employee: true },
      });

      if (!existingLog || existingLog.employee.company_id !== req.user!.companyId) {
        return res.status(404).json({ error: 'Attendance record not found.' });
      }

      let working_duration_minutes = existingLog.working_duration_minutes;

      if (check_in_at && check_out_at) {
        const diffMs = new Date(check_out_at).getTime() - new Date(check_in_at).getTime();
        working_duration_minutes = Math.max(0, Math.round(diffMs / 60000));
      } else if (check_in_at && existingLog.check_out_at) {
        const diffMs = new Date(existingLog.check_out_at).getTime() - new Date(check_in_at).getTime();
        working_duration_minutes = Math.max(0, Math.round(diffMs / 60000));
      } else if (check_out_at && existingLog.check_in_at) {
        const diffMs = new Date(check_out_at).getTime() - new Date(existingLog.check_in_at).getTime();
        working_duration_minutes = Math.max(0, Math.round(diffMs / 60000));
      }

      const updatedLog = await p.attendanceLog.update({
        where: { id: logId },
        data: {
          ...(check_in_at && { check_in_at: new Date(check_in_at) }),
          ...(check_out_at && { check_out_at: new Date(check_out_at) }),
          ...(status && { status }),
          working_duration_minutes,
          source: 'HR_MANUAL',
          created_by_id: req.user!.employeeId,
          reason: reason,
        },
      });

      return res.status(200).json({ message: 'Attendance record updated successfully', log: updatedLog });
    } catch (error) {
      console.error('HR override error:', error);
      return res.status(500).json({ error: 'Failed to apply manual override.' });
    }
  }
);

export default router;
