import { prisma } from '../../apps/api/src/lib/prisma';
import { leadFollowUpJob, staleLeadFlaggingJob } from '../../apps/api/src/jobs/tasks';

// § Phase 5: these two jobs run unsupervised on a daily cron and directly
// affect what telecallers/managers get nudged/escalated about — real
// coverage here, not just a manual smoke test.
describe('Phase 5 - Lead follow-up reminder & stale-lead flagging jobs', () => {
  const companyId = 1;
  const created = {
    employeeIds: [] as number[],
    leadIds: [] as number[],
  };

  let telecallerId: number;
  let managerId: number;

  beforeAll(async () => {
    const manager = await prisma.employee.create({
      data: {
        employee_code: `PH5-MGR-${Date.now()}`,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Phase 5 Test Manager',
      },
    });
    managerId = manager.id;

    const telecaller = await prisma.employee.create({
      data: {
        employee_code: `PH5-TC-${Date.now()}`,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Phase 5 Test Telecaller',
        reporting_manager_id: managerId,
      },
    });
    telecallerId = telecaller.id;
    created.employeeIds = [telecaller.id, manager.id];
  });

  afterAll(async () => {
    if (created.leadIds.length) {
      await prisma.leadActivity.deleteMany({ where: { lead_id: { in: created.leadIds } } });
      await prisma.auditEvent.deleteMany({
        where: { entity_id: { in: created.leadIds }, entity_type: 'LEAD' },
      });
      await prisma.notification.deleteMany({ where: { employee_id: { in: created.employeeIds } } });
      await prisma.lead.deleteMany({ where: { id: { in: created.leadIds } } });
    }
    await prisma.employee.deleteMany({ where: { id: { in: created.employeeIds } } });
  });

  const makeLead = async (opts: {
    createdDaysAgo: number;
    lastActivityDaysAgo?: number;
    status?: string;
    assignedToId?: number | null;
  }) => {
    const createdAt = new Date(Date.now() - opts.createdDaysAgo * 24 * 60 * 60 * 1000);
    const lead = await prisma.lead.create({
      data: {
        lead_code: `PH5-LEAD-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        company_id: companyId,
        customer_name: 'Phase 5 Test Customer',
        phone: `9${Math.floor(Math.random() * 1000000000)}`,
        status: opts.status ?? 'CONTACTED',
        assigned_to_id: opts.assignedToId === undefined ? telecallerId : opts.assignedToId,
        created_at: createdAt,
      },
    });
    // Prisma's created_at has @default(now()); force it to the backdated
    // value directly since create() ignores an explicit value for a
    // @default(now()) field on some providers.
    await prisma.lead.update({ where: { id: lead.id }, data: { created_at: createdAt } });

    if (opts.lastActivityDaysAgo !== undefined) {
      const activityAt = new Date(Date.now() - opts.lastActivityDaysAgo * 24 * 60 * 60 * 1000);
      const activity = await prisma.leadActivity.create({
        data: {
          lead_id: lead.id,
          actor_id: telecallerId,
          activity_type: 'CALL_LOGGED',
          notes: 'test activity',
        },
      });
      await prisma.leadActivity.update({
        where: { id: activity.id },
        data: { created_at: activityAt },
      });
    }

    created.leadIds.push(lead.id);
    return lead;
  };

  describe('leadFollowUpJob', () => {
    it('notifies the assigned telecaller for a lead inactive 2+ days', async () => {
      const lead = await makeLead({ createdDaysAgo: 10, lastActivityDaysAgo: 3 });
      await leadFollowUpJob();
      const notif = await prisma.notification.findFirst({
        where: {
          employee_id: telecallerId,
          type: 'LEAD_FOLLOW_UP_REMINDER',
          message: { contains: lead.lead_code },
        },
      });
      expect(notif).not.toBeNull();
    });

    it('does NOT notify for a lead with activity within the last 2 days', async () => {
      const lead = await makeLead({ createdDaysAgo: 10, lastActivityDaysAgo: 1 });
      await leadFollowUpJob();
      const notif = await prisma.notification.findFirst({
        where: {
          employee_id: telecallerId,
          type: 'LEAD_FOLLOW_UP_REMINDER',
          message: { contains: lead.lead_code },
        },
      });
      expect(notif).toBeNull();
    });

    it('does NOT notify for a DROPPED lead even if long inactive', async () => {
      const lead = await makeLead({
        createdDaysAgo: 10,
        lastActivityDaysAgo: 10,
        status: 'DROPPED',
      });
      await leadFollowUpJob();
      const notif = await prisma.notification.findFirst({
        where: {
          employee_id: telecallerId,
          type: 'LEAD_FOLLOW_UP_REMINDER',
          message: { contains: lead.lead_code },
        },
      });
      expect(notif).toBeNull();
    });

    it('treats a lead with no activity yet as inactive since its (backdated) creation', async () => {
      const lead = await makeLead({ createdDaysAgo: 5 });
      await leadFollowUpJob();
      const notif = await prisma.notification.findFirst({
        where: {
          employee_id: telecallerId,
          type: 'LEAD_FOLLOW_UP_REMINDER',
          message: { contains: lead.lead_code },
        },
      });
      expect(notif).not.toBeNull();
    });
  });

  describe('staleLeadFlaggingJob', () => {
    it('escalates a 5+ day inactive lead to the reporting manager', async () => {
      const lead = await makeLead({ createdDaysAgo: 10, lastActivityDaysAgo: 6 });
      await staleLeadFlaggingJob();
      const notif = await prisma.notification.findFirst({
        where: {
          employee_id: managerId,
          type: 'LEAD_STALE_FLAGGED',
          message: { contains: lead.lead_code },
        },
      });
      expect(notif).not.toBeNull();
    });

    it('does NOT escalate a lead inactive only 3 days (below the 5-day threshold)', async () => {
      const lead = await makeLead({ createdDaysAgo: 10, lastActivityDaysAgo: 3 });
      await staleLeadFlaggingJob();
      const notif = await prisma.notification.findFirst({
        where: {
          employee_id: managerId,
          type: 'LEAD_STALE_FLAGGED',
          message: { contains: lead.lead_code },
        },
      });
      expect(notif).toBeNull();
    });

    it('is idempotent — a second run within the same stale window does not re-escalate', async () => {
      const lead = await makeLead({ createdDaysAgo: 10, lastActivityDaysAgo: 6 });
      await staleLeadFlaggingJob();
      await staleLeadFlaggingJob();
      const notifs = await prisma.notification.findMany({
        where: {
          employee_id: managerId,
          type: 'LEAD_STALE_FLAGGED',
          message: { contains: lead.lead_code },
        },
      });
      expect(notifs.length).toBe(1);
    });
  });
});
