import { prisma } from '../../apps/api/src/lib/prisma';
import { updateLeadStatus } from '../../apps/api/src/services/lead/status';
import { Roles, ALL_PERMISSIONS } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Found while building the Phase 5.2 E2E smoke test: CustomerPortalService
// .provisionStub (fired on every Lead BOOKING_INITIATED -> BOOKED... actually
// on entering BOOKING_INITIATED) used `const bcrypt = await import('bcryptjs')`
// instead of a static `import bcrypt from 'bcryptjs'` (the pattern every
// other file in this codebase uses). Under ts-node — the real server's
// runtime, not just under Playwright's separate test transform — that
// dynamic import returns a module namespace object where the CJS package's
// exports land on `.default`, not spread onto the namespace directly, so
// `bcrypt.hash` was `undefined` and every real call threw
// `TypeError: bcrypt.hash is not a function`. This had never been caught
// because BOOKING_INITIATED was itself unreachable until the
// lead-negotiation-guard fix (see lead-negotiation-guard.test.ts) — nothing
// had ever actually executed this function for real. Confirmed by testing
// the dynamic import directly against ts-node before switching it to a
// static import (the fix applied here).
//
// Note: ts-jest's CommonJS transform happens to normalize `await import()`
// of a CJS module the same way a static import would, so this specific test
// cannot reproduce the failure mode by itself (reverting the fix and
// re-running it here still passes under Jest). It was confirmed to fail
// correctly under both a raw ts-node script and the real dev server via the
// Phase 5.2 Playwright E2E suite (tests/e2e/lead-to-booked.spec.ts), which is
// the actual regression guard for the ESM/CJS interop failure specifically.
// This test still has standalone value: it guards provisionStub's observable
// behavior (a real, valid bcrypt hash gets persisted) regardless of runtime.
describe('Phase 5.2 (found via E2E) - CustomerPortalService.provisionStub', () => {
  const companyId = 2;
  let mdUser: TokenPayload;
  let leadId: number;

  beforeAll(async () => {
    const employee = await prisma.employee.create({
      data: {
        employee_code: `ADMIN-PORTAL-${Date.now()}`,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Phase 5.2 Portal Stub Test Admin',
      },
    });
    mdUser = {
      employeeId: employee.id,
      employeeCode: employee.employee_code,
      companyId,
      branchId: null,
      roles: [Roles.MD],
      permissions: ALL_PERMISSIONS,
    };

    const property = await prisma.property.findFirst({ where: { company_id: companyId } });
    const lead = await prisma.lead.create({
      data: {
        lead_code: `TEST-PORTAL-${Date.now()}`,
        company_id: companyId,
        customer_name: 'Phase 5.2 Portal Stub Test Lead',
        phone: `9${Date.now().toString().slice(-9)}`,
        source: 'MANUAL_ENTRY',
        status: 'NEGOTIATION',
        created_by_id: mdUser.employeeId,
      },
    });
    leadId = lead.id;
    await prisma.opportunity.create({
      data: {
        opportunity_code: `TEST-PORTAL-OPP-${Date.now()}`,
        company_id: companyId,
        lead_id: leadId,
        owner_id: mdUser.employeeId,
        expected_value: property?.price ?? 1000000,
        property_id: property?.id,
      },
    });
  });

  afterAll(async () => {
    const customer = await prisma.customer.findFirst({ where: { origin_lead_id: leadId } });
    if (customer) await prisma.customer.delete({ where: { id: customer.id } });
    await prisma.opportunity.deleteMany({ where: { lead_id: leadId } });
    await prisma.leadActivity.deleteMany({ where: { lead_id: leadId } });
    await prisma.lead.delete({ where: { id: leadId } });
    await prisma.employee.delete({ where: { id: mdUser.employeeId } });
  });

  it('provisions a customer-portal stub without throwing on BOOKING_INITIATED', async () => {
    const updated = await updateLeadStatus(mdUser, leadId, 'BOOKING_INITIATED');
    expect(updated.status).toBe('BOOKING_INITIATED');

    const customer = await prisma.customer.findFirst({ where: { origin_lead_id: leadId } });
    expect(customer).not.toBeNull();
    expect(customer!.password_hash).toBeTruthy();
    // A bcrypt hash always starts with $2a$/$2b$/$2y$ — proves a real hash
    // was generated, not left undefined by a silently-swallowed error.
    expect(customer!.password_hash).toMatch(/^\$2[aby]\$/);
  });
});
