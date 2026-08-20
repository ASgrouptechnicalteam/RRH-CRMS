import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAuthz } from '../middleware/authz';
import { Roles, Permissions } from '@rrh-ems/shared';
import { calculatePerformanceScore, calculateLeaderboardScore } from '../services/performance-metric';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// POST /api/v1/performance/reset-score-history - Resets test events across ALL employees back to clean 50.0
router.post('/reset-score-history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await p.auditEvent.deleteMany({});
    await p.dailyReport.deleteMany({});
    await p.attendanceLog.deleteMany({});
    await p.task.deleteMany({});
    await p.performanceSnapshot.deleteMany({});

    return res.status(200).json({ message: 'All account scores reset to clean 50.0 / 100+ pts successfully!' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reset score history' });
  }
});

// GET /api/v1/performance/my-score - Calibrated Base 50.0 Event Aggregated Performance Score
router.get('/my-score', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;

    // 1. Completed tasks (+1.0 point each)
    const taskEvents = await p.task.count({
      where: { assignee_id: employeeId, status: 'COMPLETED' },
    });

    // 2. Daily reports submitted on-target (+0.5 points each)
    const reportEvents = await p.dailyReport.count({
      where: { employee_id: employeeId },
    });

    // 3. Below-target report submissions (-2.0 points penalty)
    const belowTargetEvents = await p.auditEvent.count({
      where: { actor_id: employeeId, action: 'DAILY_REPORT_BELOW_TARGET' },
    });

    // 4. Overdue tasks (-2.0 points penalty)
    const overdueTasksCount = await p.task.count({
      where: { assignee_id: employeeId, status: 'OVERDUE' },
    });

    // 5. Uninformed absence events (-5.0 points penalty)
    const uninformedAbsentEvents = await p.auditEvent.count({
      where: { actor_id: employeeId, action: 'UNINFORMED_ABSENT' },
    });

    // 6. Attendance logs
    const attendanceLogs = await p.attendanceLog.findMany({
      where: { employee_id: employeeId },
    });

    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;

    for (const log of attendanceLogs) {
      if (log.status === 'PRESENT' || log.status === 'APPROVED_LATE') presentCount++;
      if (log.status === 'LATE') lateCount++;
      if (log.status === 'HALF_DAY') halfDayCount++;
    }

    // Base score = 50.0 per business rule — centralized in performance-metric.ts
    const { score: totalScore, breakdown } = calculatePerformanceScore({
      completedTasks: taskEvents,
      overdueTasks: overdueTasksCount,
      dailyReports: reportEvents,
      belowTargetEvents,
      uninformedAbsentEvents,
      presentCount,
      lateCount,
      halfDayCount,
    });

    return res.status(200).json({
      employeeId,
      score: totalScore,
      breakdown: {
        baseScore: breakdown.baseScore,
        taskEvents: breakdown.completedTasks,
        taskBoost: breakdown.taskBoost,
        reportEvents: breakdown.dailyReports,
        reportBoost: breakdown.reportBoost,
        presentCount: breakdown.presentCount,
        presentBoost: breakdown.presentBoost,
        lateCount: breakdown.lateCount,
        latePenalty: breakdown.latePenalty,
        halfDayCount: breakdown.halfDayCount,
        halfDayPenalty: breakdown.halfDayPenalty,
        belowTargetEvents: breakdown.belowTargetEvents,
        belowTargetPenalty: breakdown.belowTargetPenalty,
        overdueTasksCount: breakdown.overdueTasks,
        overduePenalty: breakdown.overduePenalty,
        uninformedAbsentEvents: breakdown.uninformedAbsentEvents,
        uninformedAbsentPenalty: breakdown.uninformedAbsentPenalty,
      },
    });
  } catch (error) {
    console.error('Performance score calculation error:', error);
    return res.status(500).json({ error: 'Failed to calculate performance score' });
  }
});

// GET /api/v1/performance/history - Detailed Performance History Timeline
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const events: any[] = [];

    // Base score entry
    events.push({
      id: 'base-50',
      action: 'INITIAL_BASE_SCORE',
      title: 'Initial Base Performance Index',
      points: 50.0,
      type: 'BOOST',
      description: 'Default starting performance index for all team members',
      timestamp: new Date(Date.now() - 30 * 86400000),
    });

    // Task completion events
    const completedTasks = await p.task.findMany({
      where: { assignee_id: employeeId, status: 'COMPLETED' },
      orderBy: { completed_at: 'desc' },
    });
    for (const t of completedTasks) {
      events.push({
        id: `task-${t.id}`,
        action: 'TASK_COMPLETED',
        title: 'Task Completed',
        points: +1.0,
        type: 'BOOST',
        description: `Completed task: "${t.title}"`,
        timestamp: t.completed_at || t.updated_at,
      });
    }

    // Below target report audits
    const belowTargetAudits = await p.auditEvent.findMany({
      where: { actor_id: employeeId, action: 'DAILY_REPORT_BELOW_TARGET' },
      orderBy: { created_at: 'desc' },
    });
    for (const b of belowTargetAudits) {
      let parsedReason = 'Submitted daily report below assigned target';
      if (b.new_value) {
        try {
          const valObj = typeof b.new_value === 'string' ? JSON.parse(b.new_value) : b.new_value;
          if (valObj.reason) parsedReason = `Below target: "${valObj.reason}"`;
        } catch (e) {}
      }
      events.push({
        id: `bt-${b.id}`,
        action: 'DAILY_REPORT_BELOW_TARGET',
        title: 'Sub-Target Log Penalty',
        points: -2.0,
        type: 'PENALTY',
        description: parsedReason,
        timestamp: b.created_at,
      });
    }

    // Attendance logs
    const attendanceLogs = await p.attendanceLog.findMany({
      where: { employee_id: employeeId },
      orderBy: { check_in_at: 'desc' },
    });
    for (const log of attendanceLogs) {
      if (log.status === 'LATE') {
        events.push({
          id: `att-late-${log.id}`,
          action: 'LATE_CHECKIN',
          title: 'Late Check-In Penalty',
          points: -1.0,
          type: 'PENALTY',
          description: 'Check-in recorded between 10:31 AM - 11:30 AM IST without approved proposal',
          timestamp: log.check_in_at || new Date(),
        });
      } else if (log.status === 'HALF_DAY') {
        events.push({
          id: `att-hd-${log.id}`,
          action: 'HALF_DAY_CHECKIN',
          title: 'Half Day Check-In Penalty',
          points: -2.0,
          type: 'PENALTY',
          description: 'Check-in recorded after 11:30 AM IST',
          timestamp: log.check_in_at || new Date(),
        });
      } else if (log.status === 'PRESENT') {
        events.push({
          id: `att-present-${log.id}`,
          action: 'PRESENT_CHECKIN',
          title: 'On-Time Check-In',
          points: +0.5,
          type: 'BOOST',
          description: 'Checked in on-time before 10:30 AM IST',
          timestamp: log.check_in_at || new Date(),
        });
      }
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.status(200).json({ events });
  } catch (error) {
    console.error('Fetch performance history error:', error);
    return res.status(500).json({ error: 'Failed to fetch performance history' });
  }
});

// GET /api/v1/performance/leaderboard - Leaderboard (Admin filtered out)
// Packet D (15-16): company-scoped to req.user.companyId + PERMISSION_READ_TEAM authorization.
router.get('/leaderboard', authenticateToken, requireAuthz(Permissions.PERFORMANCE_READ_TEAM), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employees = await p.employee.findMany({
      where: {
        company_id: req.user!.companyId,
        roles: { none: { role: { is_invisible: true } } },
      },
      include: { branch: true, roles: { include: { role: true } } },
    });

    const leaderboard = [];
    for (const emp of employees) {
      const taskCount = await p.task.count({ where: { assignee_id: emp.id, status: 'COMPLETED' } });
      const reportCount = await p.dailyReport.count({ where: { employee_id: emp.id } });
      // Leaderboard uses the reduced (tasks + reports only) score variant, preserved as-is.
      const score = calculateLeaderboardScore(taskCount, reportCount);

      leaderboard.push({
        id: emp.id,
        employeeCode: emp.employee_code,
        branch: emp.branch?.name || 'All Branches',
        roles: emp.roles.map((r: any) => r.role.name),
        score,
        tasksCompleted: taskCount,
      });
    }

    leaderboard.sort((a, b) => b.score - a.score);

    return res.status(200).json({ leaderboard });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/v1/performance/team - Full team performance view for managers
// Packet D (15-16): company-scoped to req.user.companyId + PERMISSION_READ_TEAM authorization.
// ADMIN is preserved as an authorized team-viewer (documented legacy workflow) because the
// RolePermissionsMatrix does not currently grant ADMIN the PERFORMANCE_READ_TEAM permission.
router.get('/team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user!.roles;

    const isMD = roles.includes(Roles.MD);
    const isAdmin = roles.includes(Roles.ADMIN);
    const isHR = roles.includes(Roles.HR_MANAGER);

    // Authorization: PERFORMANCE_READ_TEAM permission governs, with ADMIN preserved.
    const hasTeamPermission = (req.user!.permissions || []).includes(Permissions.PERFORMANCE_READ_TEAM);
    const canViewTeam = hasTeamPermission || isAdmin;

    if (!canViewTeam) {
      return res.status(403).json({ error: 'Access denied: Manager or above permission required.' });
    }

    const whereClause: any = {
      company_id: req.user!.companyId,
      deleted_at: null,
      roles: { none: { role: { is_invisible: true } } },
    };

    // Strict Team Isolation: If not MD/Admin/HR, only show direct reports
    if (!isMD && !isAdmin && !isHR) {
      whereClause.reporting_manager_id = req.user!.employeeId;
    }

    const employees = await p.employee.findMany({
      where: whereClause,
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
      orderBy: { employee_code: 'asc' },
    });

    const teamScores = await Promise.all(
      employees.map(async (emp: any) => {
        const [tasksDone, tasksOverdue, reportsDone, belowTargetCount, attendanceLogs, uninformedAbsent] =
          await Promise.all([
            p.task.count({ where: { assignee_id: emp.id, status: 'COMPLETED' } }),
            p.task.count({ where: { assignee_id: emp.id, status: 'OVERDUE' } }),
            p.dailyReport.count({ where: { employee_id: emp.id } }),
            p.auditEvent.count({ where: { actor_id: emp.id, action: 'DAILY_REPORT_BELOW_TARGET' } }),
            p.attendanceLog.findMany({ where: { employee_id: emp.id }, select: { status: true } }),
            p.auditEvent.count({ where: { actor_id: emp.id, action: 'UNINFORMED_ABSENT' } }),
          ]);

        let presentCount = 0;
        let lateCount = 0;
        let halfDayCount = 0;
        for (const log of attendanceLogs) {
          if (log.status === 'PRESENT' || log.status === 'APPROVED_LATE') presentCount++;
          else if (log.status === 'LATE') lateCount++;
          else if (log.status === 'HALF_DAY') halfDayCount++;
        }

        const score = calculatePerformanceScore({
          completedTasks: tasksDone,
          overdueTasks: tasksOverdue,
          dailyReports: reportsDone,
          belowTargetEvents: belowTargetCount,
          uninformedAbsentEvents: uninformedAbsent,
          presentCount,
          lateCount,
          halfDayCount,
        }).score;

        return {
          id: emp.id,
          employeeCode: emp.employee_code,
          fullName: emp.full_name || emp.employee_code,
          branch: emp.branch?.name || '—',
          roles: emp.roles.map((r: any) => r.role.name),
          score,
          breakdown: {
            tasksDone,
            tasksOverdue,
            reportsDone,
            belowTargetCount,
            presentCount,
            lateCount,
            halfDayCount,
            uninformedAbsent,
          },
          zone:
            score >= 86 ? 'EXCELLENT' :
            score >= 66 ? 'SAFE' :
            score >= 41 ? 'SATISFACTORY' :
            'DANGER',
        };
      })
    );

    teamScores.sort((a, b) => b.score - a.score);

    return res.status(200).json({ team: teamScores, total: teamScores.length });
  } catch (error: any) {
    console.error('Team performance error:', error);
    return res.status(500).json({ error: 'Failed to fetch team performance' });
  }
});

export default router;

