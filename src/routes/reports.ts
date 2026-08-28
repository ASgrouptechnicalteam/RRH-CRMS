import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequestBody } from '../middleware/validate';
import { DailyReportSchema, Roles } from '@rrh-ems/shared';
import { getISTComponents } from '../utils/time';

const router = Router();

const p = prisma;

// POST /api/v1/reports/daily - Submit Daily Report with Below-Target Validation
router.post('/daily', authenticateToken, validateRequestBody(DailyReportSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const { role_name, metrics, summary_notes, below_target_reason } = req.body;
    const now = new Date();
    const { dateString } = getISTComponents(now);

    const calls = parseInt(metrics?.callsMade || metrics?.call_count || '0', 10);
    const visits = parseInt(metrics?.siteVisits || metrics?.site_visit_count || '0', 10);
    const deals = parseInt(metrics?.leadsQualified || metrics?.closed_deal_count || '0', 10);

    // Resolve Active Target for employee/role safely
    let activeTarget: any = null;
    if (p.dailyTarget) {
      activeTarget = await p.dailyTarget.findFirst({
        where: {
          company_id: req.user!.companyId,
          OR: [{ employee_id: employeeId }, { role_name: role_name || 'Telecaller', employee_id: null }],
        },
        orderBy: [{ employee_id: 'desc' }, { created_at: 'desc' }],
      });
    }

    let isBelowTarget = false;
    const missedMetrics: string[] = [];

    if (activeTarget) {
      if (calls < activeTarget.calls_target) {
        isBelowTarget = true;
        missedMetrics.push(`Calls: ${calls}/${activeTarget.calls_target}`);
      }
      if (visits < activeTarget.site_visits_target) {
        isBelowTarget = true;
        missedMetrics.push(`Site Visits: ${visits}/${activeTarget.site_visits_target}`);
      }
      if (deals < activeTarget.closed_deals_target) {
        isBelowTarget = true;
        missedMetrics.push(`Deals: ${deals}/${activeTarget.closed_deals_target}`);
      }
    }

    // Require min 15-char reason if below target
    if (isBelowTarget && (!below_target_reason || below_target_reason.trim().length < 15)) {
      return res.status(400).json({
        error: `Your submitted metrics are below target (${missedMetrics.join(', ')}). A valid explanation (minimum 15 characters) is required.`,
        isBelowTarget: true,
        missedMetrics,
      });
    }

    // Save Daily Report
    const report = await p.dailyReport.create({
      data: {
        employee_id: employeeId,
        submitted_at: now,
        summary: summary_notes || 'Daily work summary submitted.',
        call_count: calls,
        site_visit_count: visits,
        closed_deal_count: deals,
        target_met: !isBelowTarget,
        below_target_reason: isBelowTarget ? below_target_reason : null,
        metrics_json: metrics || null,
      },
    });

    // Write Audit Event safely supporting schema variations
    await p.auditEvent.create({
      data: {
        actor_id: employeeId,
        action: 'SUBMIT_DAILY_REPORT',
        entity_type: 'DAILY_REPORT',
        entity_id: report.id,
        new_value: JSON.stringify({ calls, visits, deals, isBelowTarget }),
      },
    });

    // Stamp penalty audit event if submitted below target with reason
    if (isBelowTarget) {
      await p.auditEvent.create({
        data: {
          actor_id: employeeId,
          action: 'DAILY_REPORT_BELOW_TARGET',
          entity_type: 'DAILY_REPORT',
          entity_id: report.id,
          new_value: JSON.stringify({ reason: below_target_reason, missedMetrics }),
        },
      });
    }

    return res.status(201).json({
      message: 'Daily report submitted successfully. Logout gate unlocked.',
      reportId: report.id,
      submittedAt: report.submitted_at,
      isBelowTarget,
    });
  } catch (error: any) {
    console.error('Submit report error:', error);
    return res.status(500).json({ error: 'Failed to submit daily report' });
  }
});

// GET /api/v1/reports/today-status - Check report status for Logout Gate
router.get('/today-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const roles = req.user!.roles;
    const { dateString } = getISTComponents(new Date());

    if (roles.includes(Roles.MD) || roles.includes(Roles.ADMIN)) {
      return res.status(200).json({ submitted: true, exempt: true });
    }

    const report = await p.dailyReport.findFirst({
      where: {
        employee_id: employeeId,
        submitted_at: {
          gte: new Date(`${dateString}T00:00:00.000Z`),
          lte: new Date(`${dateString}T23:59:59.999Z`),
        },
      },
    });

    return res.status(200).json({
      submitted: !!report,
      exempt: false,
      reportId: report?.id || null,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check report status' });
  }
});

export default router;
