import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAuthz } from '../middleware/authz';
import { Roles, Permissions } from '@rrh-ems/shared';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// GET /api/v1/md/employees - List employees for MD Control (Admin filtered out)
router.get(
  '/employees',
  authenticateToken,
  requireAuthz(Permissions.EMPLOYEES_READ),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const employees = await p.employee.findMany({
        where: {
          // Filter out Admin or invisible system roles per SDD Golden Rule #2
          roles: {
            none: {
              role: {
                is_invisible: true,
              },
            },
          },
        },
        include: {
          company: true,
          branch: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      const formatted = employees.map((emp: any) => ({
        id: emp.id,
        employeeCode: emp.employee_code,
        company: emp.company.name,
        branch: emp.branch?.name || 'All Branches',
        roles: emp.roles.map((r: any) => r.role.name),
        status: emp.status,
        attendanceRequired: emp.attendance_required,
        firstLoginDone: emp.first_login_done,
      }));

      return res.status(200).json({ employees: formatted });
    } catch (error) {
      console.error('MD employees fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch employee list' });
    }
  }
);

// PATCH /api/v1/md/employees/:id/attendance-requirement - Toggle attendance requirement
router.patch(
  '/employees/:id/attendance-requirement',
  authenticateToken,
  requireAuthz(Permissions.EMPLOYEES_UPDATE),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      const { attendanceRequired } = req.body;

      if (typeof attendanceRequired !== 'boolean') {
        return res.status(400).json({ error: 'attendanceRequired must be a boolean' });
      }

      const existing = await p.employee.findUnique({
        where: { id: targetId },
        include: { roles: { include: { role: true } } },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Safeguard: Never modify invisible Admin
      if (existing.roles.some((r: any) => r.role.is_invisible)) {
        return res.status(403).json({ error: 'Cannot modify Admin technical account' });
      }

      const updated = await p.employee.update({
        where: { id: targetId },
        data: { attendance_required: attendanceRequired },
      });

      const actorId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;

      // Write Audit Event per SDD Golden Rule #6
      await p.auditEvent.create({
        data: {
          actor_id: actorId,
          action: 'TOGGLE_ATTENDANCE_REQUIREMENT',
          entity_type: 'EMPLOYEE',
          entity_id: targetId,
          old_value: JSON.stringify({ attendance_required: existing.attendance_required }),
          new_value: JSON.stringify({ attendance_required: updated.attendance_required }),
        },
      });

      return res.status(200).json({
        message: `Updated attendance requirement for ${updated.employee_code} to ${updated.attendance_required}`,
        employeeId: updated.id,
        attendanceRequired: updated.attendance_required,
      });
    } catch (error: any) {
      console.error('❌ PATCH attendance-requirement error:', error);
      return res.status(500).json({ error: error.message || 'Failed to update attendance requirement' });
    }
  }
);

// GET /api/v1/md/executive-metrics - Real DB Metrics Aggregator for MD Executive Dashboard
router.get('/executive-metrics', authenticateToken, requireAuthz(Permissions.ADMIN_SYSTEM_METRICS), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || (req.user as any)?.company_id || 1;

    // 1. Total Leads Count
    const totalLeadsCountResult: any = await p.$queryRaw`SELECT COUNT(*) as count FROM Lead WHERE company_id = ${companyId}`;
    const totalLeadsCount = Number(totalLeadsCountResult[0]?.count || 0);

    // 2. Won Leads (Closed Deals Count)
    const wonLeadsResult: any = await p.$queryRaw`SELECT COUNT(*) as count FROM Lead WHERE company_id = ${companyId} AND status = 'WON'`;
    const totalClosedDeals = Number(wonLeadsResult[0]?.count || 0);

    const siteVisitsResult: any = await p.$queryRaw`SELECT COUNT(*) as count FROM Lead WHERE company_id = ${companyId} AND status = 'SITE_VISIT_SCHEDULED'`;
    const siteVisitsScheduled = Number(siteVisitsResult[0]?.count || 0);

    // 3. Properties Count
    const propCountRes: any = await p.$queryRaw`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'LIVE' THEN 1 ELSE 0 END) as liveCount,
        SUM(CASE WHEN status = 'PENDING_MD_APPROVAL' THEN 1 ELSE 0 END) as pendingMDCount,
        SUM(CASE WHEN status = 'PENDING_VERIFICATION' THEN 1 ELSE 0 END) as pendingPMCount
      FROM Property 
      WHERE company_id = ${companyId}
    `;
    const totalPropertiesCount = Number(propCountRes[0]?.total || 0);
    const livePropertiesCount = Number(propCountRes[0]?.liveCount || 0);
    const pendingApprovalPropertiesCount = Number(propCountRes[0]?.pendingMDCount || 0);
    const pendingVerificationPropertiesCount = Number(propCountRes[0]?.pendingPMCount || 0);

    // 4. Team Count & Attendance Exceptions
    const empCountRes: any = await p.$queryRaw`SELECT COUNT(*) as count FROM Employee WHERE company_id = ${companyId} AND status = 'ACTIVE'`;
    const totalEmployeesCount = Number(empCountRes[0]?.count || 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const stampedEmpsRes: any = await p.$queryRaw`
      SELECT COUNT(DISTINCT e.id) as count
      FROM Employee e
      LEFT JOIN AttendanceLog a ON a.employee_id = e.id AND a.check_in_at >= ${startOfDay}
      WHERE e.company_id = ${companyId} 
        AND e.status = 'ACTIVE'
        AND (e.attendance_required = false OR a.id IS NOT NULL)
    `;
    const totalExemptOrStamped = Number(stampedEmpsRes[0]?.count || 0);
    const attendanceExceptionsCount = Math.max(0, totalEmployeesCount - totalExemptOrStamped);

    return res.status(200).json({
      totalLeadsCount,
      totalClosedDeals,
      siteVisitsScheduled,
      totalPropertiesCount,
      livePropertiesCount,
      pendingApprovalPropertiesCount,
      pendingVerificationPropertiesCount,
      totalEmployeesCount,
      attendanceExceptionsCount,
    });
  } catch (error: any) {
    console.error('Fetch executive metrics error:', error);
    return res.status(500).json({ error: 'Failed to fetch executive metrics' });
  }
});

export default router;
