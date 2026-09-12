import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';

// Found during a live browser walkthrough of the full lead → booking pipeline
// (item #4/#31 of the user's manual QA pass): completeVisit() (services/
// siteVisit/lifecycle.ts) computes an `_outcomeBranch` ('NEGOTIATE' | 'DROP')
// and its own comment says "the caller (route) can advance the Lead
// accordingly" — but nothing ever read that field or called
// LeadService.updateLeadStatus. Demo's equivalent path (the frontend's
// PATCH /leads/:id/status with status DEMO_COMPLETED) does this correctly;
// Site Visit's did not. Every lead going through Site Visits (as opposed to
// Demo) was permanently stuck at SITE_VISIT_SCHEDULED after the visit
// completed — unable to ever reach SITE_VISIT_COMPLETED, NEGOTIATION,
// BOOKING_INITIATED or BOOKED. This suite locks in the fix in
// routes/siteVisits.ts's POST /:id/complete handler.
describe('Site visit completion cascades the Lead into NEGOTIATION or DROPPED', () => {
  let mdId: number;
  let agentToken: string;
  let agentId: number;
  let leadId: number;
  let propertyId: number;
  let companyId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    const mdCode = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!.employee_code;
    const mdLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: mdCode, password: 'Password@123' });
    expect(mdLogin.status).toBe(200);
    mdId = mdLogin.body.user.id;
    companyId = (await prisma.employee.findUnique({ where: { id: mdId } }))!.company_id;

    // Agent: holds site_visits.complete but NOT leads.update (RolePermissionsMatrix)
    // — the exact actor shape that silently swallowed this bug in production,
    // since the cascade must work regardless of the completing user's own
    // lead permissions.
    const agentCode = deterministicUsers.find((u) => u.roles[0] === Roles.AGENT)!.employee_code;
    const agentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: agentCode, password: 'Password@123' });
    expect(agentLogin.status).toBe(200);
    agentToken = agentLogin.body.accessToken;
    agentId = agentLogin.body.user.id;
    expect(agentLogin.body.user.permissions).not.toContain('leads.update');

    const property = await prisma.property.create({
      data: {
        property_code: `TEST-SV-CASCADE-PROP-${Date.now()}`,
        company_id: companyId,
        title: 'Site Visit Cascade Test Property',
        brand_type: 'SONTHILLU',
        category: 'PLOT',
        final_price: 5500000,
        area_sqft: 1200,
        location: 'Test Location',
        status: 'LIVE',
        created_by_id: mdId,
      },
    });
    propertyId = property.id;
  });

  afterAll(async () => {
    await prisma.property.deleteMany({ where: { id: propertyId } });
  });

  async function createScheduledLeadWithVisit(suffix: string) {
    const lead = await prisma.lead.create({
      data: {
        lead_code: `TEST-SV-CASCADE-${suffix}-${Date.now()}`,
        company_id: companyId,
        customer_name: `Cascade Test ${suffix}`,
        phone: `9${Date.now().toString().slice(-9)}`,
        source: 'MANUAL_ENTRY',
        status: 'SITE_VISIT_SCHEDULED',
        created_by_id: mdId,
      },
    });
    const visit = await prisma.siteVisitBooking.create({
      data: {
        booking_code: `TEST-SV-CASCADE-${suffix}-VISIT-${Date.now()}`,
        lead_id: lead.id,
        telecaller_id: mdId,
        assigned_agent_id: agentId,
        scheduled_date: new Date(),
        status: 'ACTIVE',
        property_id: propertyId,
      },
    });
    return { leadId: lead.id, visitId: visit.id };
  }

  async function cleanup(leadId: number, visitId: number) {
    // Also clear the feedback-request notification completeVisit() sends to
    // the assigned agent/MD — a stale one here (sharing the fixed
    // deterministic MD id with other test files' own notification lookups)
    // is exactly what made tests/api/site-visit-feedback.test.ts flaky when
    // run in the same process as this file.
    await prisma.notification.deleteMany({ where: { message: { contains: 'Cascade Test' } } });
    await prisma.siteVisitProperty.deleteMany({ where: { visit_id: visitId } });
    await prisma.siteVisitFeedback.deleteMany({ where: { site_visit_id: visitId } });
    await prisma.opportunity.deleteMany({ where: { lead_id: leadId } });
    await prisma.siteVisitBooking.deleteMany({ where: { id: visitId } });
    await prisma.leadActivity.deleteMany({ where: { lead_id: leadId } });
    await prisma.lead.deleteMany({ where: { id: leadId } });
  }

  it('an INTERESTED outcome auto-advances the Lead all the way to NEGOTIATION, with an Opportunity created', async () => {
    const { leadId, visitId } = await createScheduledLeadWithVisit('INTERESTED');
    try {
      const res = await request(app)
        .post(`/api/v1/site-visits/${visitId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          outcomes: [{ property_id: propertyId, outcome: 'INTERESTED' }],
          feedback_notes: 'Customer loved the property.',
        });
      expect(res.status).toBe(200);
      expect(res.body.visit.status).toBe('COMPLETED');

      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      expect(lead?.status).toBe('NEGOTIATION');

      const opp = await prisma.opportunity.findFirst({ where: { lead_id: leadId } });
      expect(opp).not.toBeNull();
      expect(Number(opp!.expected_value)).toBe(5500000);
    } finally {
      await cleanup(leadId, visitId);
    }
  });

  it('an all-NOT_INTERESTED outcome auto-advances the Lead to DROPPED', async () => {
    const { leadId, visitId } = await createScheduledLeadWithVisit('NOTINTERESTED');
    try {
      const res = await request(app)
        .post(`/api/v1/site-visits/${visitId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          outcomes: [
            {
              property_id: propertyId,
              outcome: 'NOT_INTERESTED',
              outcome_reason: 'Too far from workplace',
            },
          ],
          feedback_notes: 'Customer passed on this one.',
        });
      expect(res.status).toBe(200);
      expect(res.body.visit.status).toBe('COMPLETED');

      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      expect(lead?.status).toBe('DROPPED');
      expect(lead?.exited_from_status).toBe('SITE_VISIT_COMPLETED');
    } finally {
      await cleanup(leadId, visitId);
    }
  });

  it('with no property outcomes at all, the Lead still advances to SITE_VISIT_COMPLETED (not left stuck at SCHEDULED)', async () => {
    const { leadId, visitId } = await createScheduledLeadWithVisit('NOOUTCOME');
    try {
      const res = await request(app)
        .post(`/api/v1/site-visits/${visitId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ outcomes: [], feedback_notes: 'General visit, no specific property discussed.' });
      expect(res.status).toBe(200);

      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      // completeVisit's branch logic defaults an empty outcomes array to
      // 'NEGOTIATE', but the NEGOTIATION guard itself separately requires an
      // Opportunity with expected_value, which needs a real INTERESTED
      // property outcome to derive from — none exists here, so the second
      // cascade call correctly fails and is swallowed (logged, not thrown to
      // the client, since the visit itself already completed successfully).
      // The first cascade call (→ SITE_VISIT_COMPLETED) has no such
      // requirement and always succeeds — this is the regression the bug fix
      // guards against: previously NEITHER cascade call happened at all, so
      // the lead was permanently stuck at SITE_VISIT_SCHEDULED forever.
      expect(lead?.status).toBe('SITE_VISIT_COMPLETED');
    } finally {
      await cleanup(leadId, visitId);
    }
  });
});
