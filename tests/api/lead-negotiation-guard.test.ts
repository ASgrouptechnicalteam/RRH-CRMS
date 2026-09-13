import { prisma } from '../../apps/api/src/lib/prisma';
import { updateLeadStatus } from '../../apps/api/src/services/lead/status';
import { Roles, ALL_PERMISSIONS } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Found while building the Phase 5.2 E2E smoke test (walking a lead from
// creation through to BOOKED): the SITE_VISIT_COMPLETED -> NEGOTIATION
// transition was PERMANENTLY UNREACHABLE for every real lead. The guard in
// LeadWorkflow.canTransition() required an already-existing Opportunity with
// expected_value, but the only code that ever creates that Opportunity
// (OpportunityService.createFromLeadTx, in lead/status.ts's own §4 block)
// only runs AFTER the transition is validated -- so on a lead's first attempt
// there was never an Opportunity yet, and the guard always rejected it. The
// only other path that could satisfy the guard (OpportunityService
// .createFromLead, the public POST /opportunities route) is never called by
// any frontend component. This blocked the entire back half of the lead
// funnel (NEGOTIATION -> BOOKING_INITIATED -> BOOKED) for every lead, always.
describe('Phase 5.2 (found via E2E) - Lead NEGOTIATION transition is reachable', () => {
  const companyId = 2;
  let mockAdmin: TokenPayload;
  let leadId: number;
  let visitId: number;
  let propertyId: number;

  beforeAll(async () => {
    const employee = await prisma.employee.create({
      data: {
        employee_code: `ADMIN-5-2-${Date.now()}`,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Phase 5.2 Test Admin',
      },
    });
    mockAdmin = {
      employeeId: employee.id,
      employeeCode: employee.employee_code,
      companyId,
      branchId: null,
      roles: [Roles.MD],
      permissions: ALL_PERMISSIONS,
    };
    const property = await prisma.property.findFirst({ where: { company_id: companyId } });
    propertyId = property!.id;
    const lead = await prisma.lead.create({
      data: {
        lead_code: `TEST-5-2-LEAD-${Date.now()}`,
        company_id: companyId,
        customer_name: 'Phase 5.2 Negotiation Test Lead',
        phone: `9${Date.now().toString().slice(-9)}`,
        source: 'MANUAL_ENTRY',
        status: 'SITE_VISIT_COMPLETED',
        created_by_id: mockAdmin.employeeId,
      },
    });
    leadId = lead.id;
    const visit = await prisma.siteVisitBooking.create({
      data: {
        booking_code: `TEST-5-2-VISIT-${Date.now()}`,
        lead_id: leadId,
        telecaller_id: mockAdmin.employeeId,
        scheduled_date: new Date(),
        status: 'COMPLETED',
      },
    });
    visitId = visit.id;
    await prisma.siteVisitProperty.create({
      data: { visit_id: visitId, property_id: propertyId, outcome: 'INTERESTED' },
    });
  });

  afterAll(async () => {
    await prisma.opportunity.deleteMany({ where: { lead_id: leadId } });
    await prisma.siteVisitProperty.deleteMany({ where: { visit_id: visitId } });
    await prisma.siteVisitBooking.delete({ where: { id: visitId } });
    await prisma.leadActivity.deleteMany({ where: { lead_id: leadId } });
    await prisma.lead.delete({ where: { id: leadId } });
    await prisma.employee.delete({ where: { id: mockAdmin.employeeId } });
  });

  it('moves SITE_VISIT_COMPLETED -> NEGOTIATION on the first attempt, auto-creating a real Opportunity', async () => {
    const updated = await updateLeadStatus(mockAdmin, leadId, 'NEGOTIATION');
    expect(updated.status).toBe('NEGOTIATION');

    const opp = await prisma.opportunity.findFirst({ where: { lead_id: leadId } });
    expect(opp).not.toBeNull();
    expect(opp!.property_id).toBe(propertyId);
    expect(opp!.expected_value).not.toBeNull();
  });

  it('then allows BOOKING_INITIATED and BOOKED using that same Opportunity', async () => {
    const toBookingInitiated = await updateLeadStatus(mockAdmin, leadId, 'BOOKING_INITIATED');
    expect(toBookingInitiated.status).toBe('BOOKING_INITIATED');

    const toBooked = await updateLeadStatus(mockAdmin, leadId, 'BOOKED');
    expect(toBooked.status).toBe('BOOKED');
  });
});
