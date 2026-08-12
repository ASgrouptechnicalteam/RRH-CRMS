import { PrismaClient } from '@prisma/client';
import { buildLeadScope, buildEmployeeScope, buildPropertyScope } from '../../apps/api/src/authz/dataScope';
import { Roles } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

const prisma = new PrismaClient();

describe('Phase 3 - Central Data Scope Engine (Security Matrix)', () => {
  const companyId = 1;
  const otherCompanyId = 2;

  const mockAdmin: TokenPayload = { employeeId: 999, employeeCode: 'ADMIN', companyId, branchId: null, roles: [Roles.ADMIN] };
  const mockMD: TokenPayload = { employeeId: 101, employeeCode: 'MD', companyId, branchId: null, roles: [Roles.MD] };
  const mockOtherMD: TokenPayload = { employeeId: 201, employeeCode: 'MD2', companyId: otherCompanyId, branchId: null, roles: [Roles.MD] };
  const mockManager: TokenPayload = { employeeId: 102, employeeCode: 'MGR', companyId, branchId: null, roles: [Roles.TELECALLER] }; // Assuming manager just means having downstream
  const mockTelecallerA: TokenPayload = { employeeId: 103, employeeCode: 'TC-A', companyId, branchId: null, roles: [Roles.TELECALLER] };
  const mockTelecallerB: TokenPayload = { employeeId: 104, employeeCode: 'TC-B', companyId, branchId: null, roles: [Roles.TELECALLER] };
  const mockCP: TokenPayload = { employeeId: 105, employeeCode: 'RRH-CP-1', companyId, branchId: null, roles: [Roles.CHANNEL_PARTNER] };
  const mockOtherCP: TokenPayload = { employeeId: 205, employeeCode: 'RRH-CP-2', companyId: otherCompanyId, branchId: null, roles: [Roles.CHANNEL_PARTNER] };
  const mockPM: TokenPayload = { employeeId: 106, employeeCode: 'PM', companyId, branchId: null, roles: [Roles.PROJECT_MANAGER] };

  // Setup actual employees in DB for hierarchy tests
  beforeAll(async () => {
    // We assume the DB is seeded enough for isolated tests, or we seed what we need.
    // For hierarchy, getDownstreamEmployeeIds relies on DB.
    await prisma.employee.createMany({
      data: [
        { id: 99901, employee_code: 'HIER-1', company_id: companyId, password_hash: '', status: 'ACTIVE', full_name: 'Manager' },
        { id: 99902, employee_code: 'HIER-2', company_id: companyId, reporting_manager_id: 99901, password_hash: '', status: 'ACTIVE', full_name: 'Direct Report' },
        { id: 99903, employee_code: 'HIER-3', company_id: companyId, reporting_manager_id: 99902, password_hash: '', status: 'ACTIVE', full_name: 'Recursive Report' },
        { id: 99904, employee_code: 'HIER-4', company_id: otherCompanyId, reporting_manager_id: 99901, password_hash: '', status: 'ACTIVE', full_name: 'Cross Company Report (Invalid)' }
      ],
      skipDuplicates: true
    });
  });

  afterAll(async () => {
    await prisma.employee.deleteMany({
      where: { id: { in: [99901, 99902, 99903, 99904] } }
    });
  });

  describe('Lead Scope Contract', () => {
    it('1. Admin receives global visibility', async () => {
      const scope = await buildLeadScope(mockAdmin);
      expect(scope).toEqual({});
    });

    it('2. Management sees all same-company leads', async () => {
      const scope = await buildLeadScope(mockMD);
      expect(scope).toEqual({ company_id: companyId });
    });

    it('2b. Management cannot see cross-company leads', async () => {
      const scope = await buildLeadScope(mockMD);
      expect(scope).not.toHaveProperty('company_id', otherCompanyId);
    });

    it('3. Telecaller sees their assigned/created leads only', async () => {
      const scope = await buildLeadScope(mockTelecallerA);
      expect(scope.company_id).toBe(companyId);
      expect(scope.OR).toBeDefined();
      expect(scope.OR).toContainEqual({ assigned_to_id: { in: [103] } });
      expect(scope.OR).toContainEqual({ created_by_id: { in: [103] } });
    });

    it('4. Telecaller A cannot see Telecaller B\'s unrelated leads', async () => {
      const scope = await buildLeadScope(mockTelecallerA);
      // Since it's restricted to 103, 104 is naturally excluded.
      expect(JSON.stringify(scope)).not.toContain('104');
    });

    it('5. Manager sees multi-level downstream leads', async () => {
      const mgrPayload: TokenPayload = { employeeId: 99901, employeeCode: 'HIER-1', companyId, branchId: null, roles: [Roles.TELECALLER] };
      const scope = await buildLeadScope(mgrPayload);
      expect(scope.company_id).toBe(companyId);
      
      const orClause = scope.OR as any[];
      const assignedIn = orClause.find(c => c.assigned_to_id)?.assigned_to_id.in;
      expect(assignedIn).toContain(99901); // Self
      expect(assignedIn).toContain(99902); // Direct
      expect(assignedIn).toContain(99903); // Recursive
      
      // Should NOT contain cross company even if reporting matches
      // Wait, getDownstream filters by company_id in the fetch!
      expect(assignedIn).not.toContain(99904);
    });

    it('6. CP cannot see the global lead pool, only linked via lock', async () => {
      const scope = await buildLeadScope(mockCP);
      expect(scope.company_id).toBe(companyId);
      expect(scope.OR).toBeDefined();
      expect(scope.OR).toEqual([
        { protection_lock: { cp: { cp_code: mockCP.employeeCode } } }
      ]);
    });
  });

  describe('Employee Scope Contract', () => {
    it('7. Admin sees employees globally', async () => {
      const scope = await buildEmployeeScope(mockAdmin);
      expect(scope).toEqual({});
    });

    it('8. Management sees same-company employees (excluding invisible)', async () => {
      const scope = await buildEmployeeScope(mockMD);
      expect(scope.company_id).toBe(companyId);
      expect(scope.roles).toEqual({ none: { role: { is_invisible: true } } });
      expect(scope.id).toBeUndefined(); // Not limited by IDs
    });

    it('9. Manager sees self and downstream reports', async () => {
      const mgrPayload: TokenPayload = { employeeId: 99901, employeeCode: 'HIER-1', companyId, branchId: null, roles: [Roles.TELECALLER] };
      const scope = await buildEmployeeScope(mgrPayload);
      expect(scope.company_id).toBe(companyId);
      expect(scope.id?.in).toContain(99901);
      expect(scope.id?.in).toContain(99902);
      expect(scope.id?.in).toContain(99903);
      expect(scope.id?.in).not.toContain(99904); // Cross company excluded
    });

    it('10. CP receives ZERO employee records', async () => {
      const scope = await buildEmployeeScope(mockCP);
      expect(scope).toEqual({ id: { in: [] } }); // Hard stop
    });
  });

  describe('Property Scope Contract', () => {
    it('11. Admin sees all properties globally', async () => {
      const mockAdminProp: TokenPayload = { ...mockAdmin, roles: [Roles.ADMIN] };
      const scope = await buildPropertyScope(mockAdminProp);
      expect(scope).toEqual({});
    });

    it('12. Management sees same-company properties', async () => {
      const scope = await buildPropertyScope(mockMD);
      expect(scope).toEqual({ company_id: companyId });
    });

    it('13. PM sees assigned properties and LIVE properties', async () => {
      const scope = await buildPropertyScope(mockPM);
      expect(scope.company_id).toBe(companyId);
      expect(scope.OR).toContainEqual({ assigned_pm_id: mockPM.employeeId });
      expect(scope.OR).toContainEqual({ status: 'LIVE' });
    });

    it('14. Telecaller sees LIVE properties only', async () => {
      const scope = await buildPropertyScope(mockTelecallerA);
      expect(scope.company_id).toBe(companyId);
      expect(scope.status).toBe('LIVE');
      expect(scope.OR).toBeUndefined(); // Does not see assigned
    });

    it('15. CP sees LIVE properties only', async () => {
      const scope = await buildPropertyScope(mockCP);
      expect(scope.company_id).toBe(companyId);
      expect(scope.status).toBe('LIVE');
    });
  });
});
