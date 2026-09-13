import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';

// Found while building the Phase 5.2 E2E smoke test: no frontend component
// ever sends an `outcomes` field when completing a site visit (grep across
// apps/web/src confirmed this), but SiteVisitCompleteSchema required
// `outcomes: z.array(...).min(1)` — so every real "Complete Visit" submission
// from the actual UI was rejected with 400 "outcomes: Required", for every
// visit, always (the min(1) rejected even a booking with no property
// attached, a normal, real state — see SiteVisitCreateSchema's optional
// property_id). This is a regression guard for the schema fix (outcomes now
// defaults to []) plus the SiteVisitManagement.tsx fix that makes the
// property-outcome selector conditional on a property actually being linked.
describe('Phase 5.2 (found via E2E) - completing a site visit with no linked property', () => {
  let mdToken: string;
  let leadId: number;
  let visitId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    const mdCode = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!.employee_code;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: mdCode, password: 'Password@123' });
    if (loginRes.status !== 200) throw new Error(`MD login failed: ${loginRes.text}`);
    mdToken = loginRes.body.accessToken;

    const md = await prisma.employee.findFirst({ where: { employee_code: mdCode } });
    const lead = await prisma.lead.create({
      data: {
        lead_code: `TEST-5-2-NOPROP-${Date.now()}`,
        company_id: md!.company_id,
        customer_name: 'Phase 5.2 No-Property Visit Test',
        phone: `9${Date.now().toString().slice(-9)}`,
        source: 'MANUAL_ENTRY',
        status: 'SITE_VISIT_SCHEDULED',
        created_by_id: md!.id,
      },
    });
    leadId = lead.id;
    const visit = await prisma.siteVisitBooking.create({
      data: {
        booking_code: `TEST-5-2-NOPROP-VISIT-${Date.now()}`,
        lead_id: leadId,
        telecaller_id: md!.id,
        scheduled_date: new Date(),
        status: 'ACTIVE',
        // Deliberately no property_id / site_visit_properties — a real,
        // valid booking state (property optional at booking time).
      },
    });
    visitId = visit.id;
  });

  afterAll(async () => {
    await prisma.siteVisitBooking.deleteMany({ where: { id: visitId } });
    await prisma.leadActivity.deleteMany({ where: { lead_id: leadId } });
    await prisma.lead.delete({ where: { id: leadId } });
  });

  it('accepts an empty outcomes array instead of rejecting with "outcomes: Required"', async () => {
    const res = await request(app)
      .post(`/api/v1/site-visits/${visitId}/complete`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ outcomes: [], feedback_notes: 'No specific property discussed on this visit.' });

    expect(res.status).toBe(200);
    expect(res.body.visit.status).toBe('COMPLETED');
  });
});
