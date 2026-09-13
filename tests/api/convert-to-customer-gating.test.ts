import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';

// User-reported flaw: "Convert to Customer" had no lead-status precondition
// and unconditionally force-transitioned the Lead straight to BOOKED — a
// transition the workflow only allows FROM BOOKING_INITIATED. Converting
// from any earlier status (e.g. NEGOTIATION) always threw after already
// creating the Customer row, rolling back the whole transaction with a
// confusing generic error. Fixed with an explicit upfront status check in
// CustomerService.convertFromLead, plus a frontend gate on the button itself.
describe('Convert-to-Customer is gated to BOOKING_INITIATED', () => {
  const companyId = 2;
  let mdToken: string;
  let negotiationLeadId: number;
  let bookingInitiatedLeadId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    const mdFixture = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!;
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: mdFixture.employee_code, password: 'Password@123' });
    expect(login.status).toBe(200);
    mdToken = login.body.accessToken;
    const mdId = login.body.user.id;

    const property = await prisma.property.findFirst({ where: { company_id: companyId } });

    const negotiationLead = await prisma.lead.create({
      data: {
        lead_code: `TEST-CONVERT-NEG-${Date.now()}`,
        company_id: companyId,
        customer_name: 'Convert Gating Test — Negotiation',
        phone: `9${Date.now().toString().slice(-9)}`,
        source: 'MANUAL_ENTRY',
        status: 'NEGOTIATION',
        created_by_id: mdId,
      },
    });
    negotiationLeadId = negotiationLead.id;
    await prisma.opportunity.create({
      data: {
        opportunity_code: `TEST-CONVERT-NEG-OPP-${Date.now()}`,
        company_id: companyId,
        lead_id: negotiationLeadId,
        owner_id: mdId,
        expected_value: 1000000,
        property_id: property?.id,
      },
    });

    // Deliberately set directly to BOOKING_INITIATED via a raw update, NOT
    // through updateLeadStatus() — reaching that status through the normal
    // transition path (services/lead/status.ts §6) already auto-provisions
    // a Customer as a side effect (CustomerPortalService.provisionStub), so
    // going through it here would make the explicit convert-to-customer
    // endpoint always see "already converted" regardless of the status gate
    // this test exists to check. This isolates the one thing Phase 1 changed:
    // the explicit endpoint's own status precondition.
    const bookingLead = await prisma.lead.create({
      data: {
        lead_code: `TEST-CONVERT-BI-${Date.now()}`,
        company_id: companyId,
        customer_name: 'Convert Gating Test — Booking Initiated',
        phone: `9${Date.now().toString().slice(-8)}1`,
        source: 'MANUAL_ENTRY',
        status: 'BOOKING_INITIATED',
        created_by_id: mdId,
      },
    });
    bookingInitiatedLeadId = bookingLead.id;
    await prisma.opportunity.create({
      data: {
        opportunity_code: `TEST-CONVERT-BI-OPP-${Date.now()}`,
        company_id: companyId,
        lead_id: bookingInitiatedLeadId,
        owner_id: mdId,
        expected_value: 1000000,
        property_id: property?.id,
      },
    });
  });

  afterAll(async () => {
    for (const leadId of [negotiationLeadId, bookingInitiatedLeadId]) {
      const customer = await prisma.customer.findFirst({ where: { origin_lead_id: leadId } });
      if (customer) await prisma.customer.delete({ where: { id: customer.id } });
      await prisma.opportunity.deleteMany({ where: { lead_id: leadId } });
      await prisma.leadActivity.deleteMany({ where: { lead_id: leadId } });
      await prisma.lead.delete({ where: { id: leadId } });
    }
  });

  it('rejects conversion from NEGOTIATION with a clear 409, and does not create a Customer row', async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${negotiationLeadId}/convert-to-customer`)
      .set('Authorization', `Bearer ${mdToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Booking Initiated/i);

    const customer = await prisma.customer.findFirst({
      where: { origin_lead_id: negotiationLeadId },
    });
    expect(customer).toBeNull();

    const lead = await prisma.lead.findUnique({ where: { id: negotiationLeadId } });
    expect(lead!.status).toBe('NEGOTIATION');
  });

  it('succeeds from BOOKING_INITIATED and transitions the lead to BOOKED', async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${bookingInitiatedLeadId}/convert-to-customer`)
      .set('Authorization', `Bearer ${mdToken}`);
    expect(res.status).toBe(201);

    const lead = await prisma.lead.findUnique({ where: { id: bookingInitiatedLeadId } });
    expect(lead!.status).toBe('BOOKED');

    const customer = await prisma.customer.findFirst({
      where: { origin_lead_id: bookingInitiatedLeadId },
    });
    expect(customer).not.toBeNull();
  });
});
