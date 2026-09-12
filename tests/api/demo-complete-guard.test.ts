import { prisma } from '../../apps/api/src/lib/prisma';
import * as DemoService from '../../apps/api/src/services/demo.service';
import { Roles } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Found during the Phase 2 lead-workflow re-audit (item #4/#31): completeDemo()
// wrote `p.lead.update({ data: { status: 'DEMO_COMPLETED' } })` directly,
// bypassing WorkflowEngine.transitionLead entirely — so it never checked the
// lead's current status first. Completing a demo attached to a lead that was
// e.g. already BOOKED or in NEGOTIATION would silently force it back to
// DEMO_COMPLETED with no error. Also, all four demo actions (accept/decline/
// complete/cancel) gated their MD/Admin override on `user.roles[0]` only —
// a multi-role actor whose token happened to list a different role first
// would be wrongly denied even though they hold MD/Admin somewhere in the
// array. This suite locks in both fixes.
describe('Item #4/#31 — completeDemo respects the lead workflow guard', () => {
  const companyId = 1;
  let handlerId: number;
  let mdId: number;

  beforeAll(async () => {
    const handler = await prisma.employee.create({
      data: {
        employee_code: `TEST-DEMO-HANDLER-${Date.now()}`,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Demo Guard Test Handler',
      },
    });
    handlerId = handler.id;

    const md = await prisma.employee.create({
      data: {
        employee_code: `TEST-DEMO-MD-${Date.now()}`,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Demo Guard Test MD',
      },
    });
    mdId = md.id;
  });

  afterAll(async () => {
    await prisma.employee.deleteMany({ where: { id: { in: [handlerId, mdId] } } });
  });

  async function createLeadAndDemo(status: string) {
    const lead = await prisma.lead.create({
      data: {
        lead_code: `TEST-DEMO-GUARD-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        company_id: companyId,
        customer_name: 'Demo Guard Test Customer',
        phone: `9${Date.now().toString().slice(-9)}`,
        source: 'MANUAL_ENTRY',
        status,
        created_by_id: handlerId,
      },
    });
    const demo = await prisma.demo.create({
      data: {
        lead_id: lead.id,
        handler_id: handlerId,
        scheduled_at: new Date(),
        summary: 'Demo Guard Test',
      },
    });
    return { leadId: lead.id, demoId: demo.id };
  }

  async function cleanup(leadId: number, demoId: number) {
    await prisma.demo.deleteMany({ where: { id: demoId } });
    await prisma.leadActivity.deleteMany({ where: { lead_id: leadId } });
    await prisma.lead.deleteMany({ where: { id: leadId } });
  }

  it('completes normally from DEMO_SCHEDULED (the real happy path)', async () => {
    const { leadId, demoId } = await createLeadAndDemo('DEMO_SCHEDULED');
    try {
      const handlerToken: TokenPayload = {
        employeeId: handlerId,
        employeeCode: 'x',
        companyId,
        branchId: null,
        roles: [Roles.AGENT],
      };
      await DemoService.completeDemo(handlerToken, demoId, 'Went well.');
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      expect(lead?.status).toBe('DEMO_COMPLETED');
    } finally {
      await cleanup(leadId, demoId);
    }
  });

  it('rejects completing a demo whose lead is NOT at DEMO_SCHEDULED (e.g. already BOOKED)', async () => {
    const { leadId, demoId } = await createLeadAndDemo('BOOKED');
    try {
      const handlerToken: TokenPayload = {
        employeeId: handlerId,
        employeeCode: 'x',
        companyId,
        branchId: null,
        roles: [Roles.AGENT],
      };
      // WorkflowEngine.transitionLead throws a plain Error with `statusCode`
      // set (not `status`, unlike this file's other hand-thrown AppErrors).
      await expect(
        DemoService.completeDemo(handlerToken, demoId, 'Went well.'),
      ).rejects.toMatchObject({
        statusCode: 409,
      });
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      // Untouched — the old bug would have silently forced this to DEMO_COMPLETED.
      expect(lead?.status).toBe('BOOKED');
    } finally {
      await cleanup(leadId, demoId);
    }
  });

  it("an MD whose token lists a non-MD role first can still complete someone else's demo", async () => {
    const { leadId, demoId } = await createLeadAndDemo('DEMO_SCHEDULED');
    try {
      const multiRoleMdToken: TokenPayload = {
        employeeId: mdId,
        employeeCode: 'x',
        companyId,
        branchId: null,
        // MD is NOT roles[0] here — the exact shape the old buggy check would
        // have rejected.
        roles: [Roles.TELECALLER, Roles.MD],
      };
      await DemoService.completeDemo(multiRoleMdToken, demoId, 'MD stepped in.');
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      expect(lead?.status).toBe('DEMO_COMPLETED');
    } finally {
      await cleanup(leadId, demoId);
    }
  });
});
