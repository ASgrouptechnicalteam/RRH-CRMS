import { LeadService } from '../../apps/api/src/services/lead.service';
import { prisma } from '../../apps/api/src/lib/prisma';
import { TokenPayload } from '../../apps/api/src/utils/jwt';
import { Roles } from '@rrh-ems/shared';

// Phase 2.13 (2026-09-06): LeadService.bulkUploadLeads previously had no row
// cap at all — an import of any size ran fully inline within one HTTP
// request. Capped at 1000 rows (the upper end of the plan's suggested
// 500-1000 range), matching the same class of cap already applied to bulk
// property-unit creation (2.19's 500-unit limit).
describe('Phase 2.13 - Bulk lead upload row cap', () => {
  const mockUser: TokenPayload = {
    employeeId: 1,
    employeeCode: 'RRH-TST-001',
    companyId: 1,
    branchId: null,
    roles: [Roles.ADMIN],
  };

  it('Rejects a batch of 1001 rows with a clear AppError before doing any DB work', async () => {
    const rows = Array.from({ length: 1001 }, (_, i) => ({
      customer_name: `Lead ${i}`,
      phone: `+9199999${i}`,
    }));
    await expect(LeadService.bulkUploadLeads(mockUser, rows)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('Cannot upload more than 1000 leads'),
    });
  });

  it('Accepts exactly 1000 rows without hitting the cap (validated at the boundary, not before it)', async () => {
    // 1000 rows is right at the cap — should pass the cap check and proceed
    // into the real processing loop rather than being rejected. Rows are
    // deliberately invalid (no customer_name) so each one fails fast on the
    // pre-existing "missing required fields" check with zero DB writes —
    // this test only needs to prove the cap itself doesn't fire at exactly
    // 1000, not exercise the full dedup/assignment pipeline.
    const rows = Array.from({ length: 1000 }, () => ({ phone: '+919999999999' }));
    const result = await LeadService.bulkUploadLeads(mockUser, rows);
    expect(result.total_rows).toBe(1000);
    expect(result.failed_rows).toBe(1000);
  });
});

// Found while verifying the bulk upload feature (a separate ask): the
// duplicate-detection query had no company_id filter at all, so a phone/email
// that happened to match ANY OTHER company's lead was wrongly rejected as a
// "duplicate" (or worse, attempted a cross-company recovery that then failed)
// instead of being created as a genuinely new lead for the uploading company.
describe('Bulk upload duplicate-detection is company-scoped', () => {
  const companyACode = `TEST-BULK-A-${Date.now()}`;
  const companyBCode = `TEST-BULK-B-${Date.now()}`;
  let companyA: any;
  let companyB: any;
  let employeeA: any;
  let existingLeadInB: any;
  const sharedPhone = `+9199${Date.now().toString().slice(-8)}`;

  beforeAll(async () => {
    companyA = await prisma.company.create({
      data: { name: 'Bulk Test Co A', code: companyACode },
    });
    companyB = await prisma.company.create({
      data: { name: 'Bulk Test Co B', code: companyBCode },
    });
    employeeA = await prisma.employee.create({
      data: {
        employee_code: `BULK-A-${Date.now()}`,
        company_id: companyA.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Bulk Test Employee A',
      },
    });
    // A lead with the same phone number already exists, but for a DIFFERENT company.
    existingLeadInB = await prisma.lead.create({
      data: {
        lead_code: `TEST-BULK-B-LEAD-${Date.now()}`,
        company_id: companyB.id,
        customer_name: 'Company B Existing Customer',
        phone: sharedPhone,
        source: 'MANUAL_ENTRY',
        status: 'NEW',
      },
    });
  });

  afterAll(async () => {
    await prisma.leadActivity.deleteMany({
      where: { lead: { company_id: { in: [companyA.id, companyB.id] } } },
    });
    await prisma.lead.deleteMany({ where: { company_id: { in: [companyA.id, companyB.id] } } });
    await prisma.employee.delete({ where: { id: employeeA.id } });
    await prisma.company.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } });
  });

  it('creates a genuinely new lead for Company A even though the same phone already exists as a lead in Company B', async () => {
    const user: TokenPayload = {
      employeeId: employeeA.id,
      employeeCode: employeeA.employee_code,
      companyId: companyA.id,
      branchId: null,
      roles: [Roles.MD],
    };
    const result = await LeadService.bulkUploadLeads(user, [
      { customer_name: 'Company A New Customer', phone: sharedPhone },
    ]);

    expect(result.successful_imports).toBe(1);
    expect(result.duplicates).toBe(0);
    expect(result.failed_rows).toBe(0);

    const createdInA = await prisma.lead.findFirst({
      where: { company_id: companyA.id, phone: sharedPhone },
    });
    expect(createdInA).not.toBeNull();
    expect(createdInA?.customer_name).toBe('Company A New Customer');

    // Company B's original lead must be completely untouched.
    const stillInB = await prisma.lead.findUnique({ where: { id: existingLeadInB.id } });
    expect(stillInB?.customer_name).toBe('Company B Existing Customer');
    expect(stillInB?.status).toBe('NEW');
  });
});
