import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequestBody } from '../middleware/validate';
import { DailyTargetSetSchema, Roles } from '@rrh-ems/shared';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// Standard 1-Click Role Presets (Saving MD & Marketing Director time)
const ROLE_PRESETS: Record<string, { target_type: string; targets_json: Record<string, any> }> = {
  [Roles.TELECALLER]: {
    target_type: 'COUNT',
    targets_json: { callsMade: 50, leadsQualified: 5, followupsDone: 15 },
  },
  [Roles.PROJECT_MANAGER]: {
    target_type: 'COUNT',
    targets_json: { siteVisits: 3, propertyVerifications: 2 },
  },
  [Roles.DIGITAL_LEAD_OPERATOR]: {
    target_type: 'COUNT',
    targets_json: { leadsProcessed: 100, telecallerAssignments: 5 },
  },
  [Roles.DIGITAL_MARKETING_HEAD]: {
    target_type: 'COUNT',
    targets_json: { adSpendMonitored: 1, contentPosts: 3, leadsGenerated: 20 },
  },
  [Roles.CHANNEL_PARTNER_MANAGER]: {
    target_type: 'COUNT',
    targets_json: { cpMeetings: 8, newCpOnboarded: 1 },
  },
  [Roles.HR_MANAGER]: {
    target_type: 'COUNT',
    targets_json: { interviewsConducted: 5, attendanceQueueCleared: 1 },
  },
  [Roles.FINANCE]: {
    target_type: 'COUNT',
    targets_json: { invoicesProcessed: 10, paymentAudits: 1 },
  },
  [Roles.STAFF]: {
    target_type: 'CHECKLIST',
    targets_json: { dailyTaskListCompleted: true, endOfDayCleanup: true },
  },
};

// GET /api/v1/targets/presets - Get 1-click default preset suggestions
router.get('/presets', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({ presets: ROLE_PRESETS });
});

// GET /api/v1/targets/my-target - Effective target resolution with Priority Hierarchy
router.get('/my-target', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const roleName = req.user!.roles[0] || Roles.STAFF;

    // Priority 1: Employee-Specific Target (if active)
    let empTarget: any = null;
    if (p.dailyTarget) {
      empTarget = await p.dailyTarget.findFirst({
        where: {
          employee_id: employeeId,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    if (empTarget) {
      return res.status(200).json({
        source: 'EMPLOYEE_SPECIFIC',
        target: empTarget,
      });
    }

    // Priority 2: Active Role-Based Target
    let roleTarget: any = null;
    if (p.dailyTarget) {
      roleTarget = await p.dailyTarget.findFirst({
        where: {
          role_name: roleName,
          employee_id: null,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    if (roleTarget) {
      return res.status(200).json({
        source: 'ROLE_BASED',
        target: roleTarget,
      });
    }

    // Priority 3: System Default Preset Fallback
    const preset = ROLE_PRESETS[roleName] || ROLE_PRESETS[Roles.STAFF];
    return res.status(200).json({
      source: 'SYSTEM_PRESET',
      target: {
        role_name: roleName,
        target_type: preset.target_type,
        targets_json: preset.targets_json,
      },
    });
  } catch (error) {
    console.error('Fetch my-target error:', error);
    return res.status(500).json({ error: 'Failed to resolve active target' });
  }
});

// GET /api/v1/targets/all - List all targets (MD & Marketing Director view)
router.get('/all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user!.roles;
    if (!roles.includes(Roles.MD) && !roles.includes(Roles.MARKETING_DIRECTOR) && !roles.includes(Roles.ADMIN)) {
      return res.status(403).json({ error: 'Access denied: MD or Marketing Director permission required.' });
    }

    let targets: any[] = [];
    if (p.dailyTarget) {
      targets = await p.dailyTarget.findMany({
        include: { employee: true },
        orderBy: { created_at: 'desc' },
      });
    }

    return res.status(200).json({ targets });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch targets' });
  }
});

// POST /api/v1/targets - Set/Update Target (MD & Marketing Director)
router.post('/', authenticateToken, validateRequestBody(DailyTargetSetSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user!.roles;
    if (!roles.includes(Roles.MD) && !roles.includes(Roles.MARKETING_DIRECTOR) && !roles.includes(Roles.ADMIN)) {
      return res.status(403).json({ error: 'Access denied: MD or Marketing Director permission required.' });
    }

    const { role_name, employee_id, target_type, targets_json } = req.body;
    const creatorId = req.user!.employeeId;

    let newTarget: any = null;
    if (p.dailyTarget) {
      newTarget = await p.dailyTarget.create({
        data: {
          role_name,
          employee_id: employee_id || null,
          calls_target: targets_json?.callsMade || 50,
          site_visits_target: targets_json?.siteVisits || 3,
          closed_deals_target: targets_json?.closedDeals || 1,
        },
      });
    }

    // Write Audit Event
    await p.auditEvent.create({
      data: {
        actor_id: creatorId,
        action: 'SET_DAILY_TARGET',
        entity_type: 'DAILY_TARGET',
        entity_id: newTarget?.id || 1,
        new_value: JSON.stringify({ role_name, employee_id, target_type, targets_json }),
      },
    });

    return res.status(201).json({ message: 'Daily target set successfully', target: newTarget });
  } catch (error) {
    console.error('Set target error:', error);
    return res.status(500).json({ error: 'Failed to set target' });
  }
});

export default router;
