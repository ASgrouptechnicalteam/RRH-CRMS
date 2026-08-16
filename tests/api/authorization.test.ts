import { describe, expect, it } from '@jest/globals';
import { can } from '../../apps/api/src/authz/authorization';
import { Permissions, Roles } from '@rrh-ems/shared';

describe('Layer 1: Authorization Engine Unit Tests', () => {
  const baseUser = {
    employeeId: 1,
    employeeCode: 'EMP-001',
    companyId: 1,
    branchId: 1,
    roles: [Roles.TELECALLER],
    permissions: [
      Permissions.PROPERTIES_VERIFY,
      Permissions.PROPERTIES_CREATE,
      Permissions.SITE_VISITS_COMPLETE,
      Permissions.LEADS_READ,
    ] as any[],
  };

  const adminUser = {
    ...baseUser,
    roles: [Roles.ADMIN],
    permissions: [Permissions.EMPLOYEES_VIEW_SENSITIVE, Permissions.SITE_VISITS_COMPLETE] as any[],
  };

  const pmUser = {
    ...baseUser,
    employeeId: 2,
    roles: [Roles.PROJECT_MANAGER],
    permissions: [Permissions.PROPERTIES_UPDATE, Permissions.PROPERTIES_VERIFY] as any[],
  };


  it('permits admin to complete unassigned site visit', () => {
    const visit = { assigned_agent_id: 99, lead: { company_id: 1 } };
    expect(can(adminUser, Permissions.SITE_VISITS_COMPLETE, visit)).toBe(true);
  });

  it('prevents cross-company site visit completion for Telecaller', () => {
    const visit = { assigned_agent_id: 1, lead: { company_id: 99 } }; // different company
    expect(can(baseUser, Permissions.SITE_VISITS_COMPLETE, visit)).toBe(false);
  });

  it('prevents non-HR/Admin from viewing sensitive employee data cross-company', () => {
    const targetEmp = { company_id: 99 };
    // Normal user does not have the permission anyway, but even if they did...
    const hrUser = { ...baseUser, roles: [Roles.HR_MANAGER], permissions: [Permissions.EMPLOYEES_VIEW_SENSITIVE] as any[] };
    expect(can(hrUser, Permissions.EMPLOYEES_VIEW_SENSITIVE, targetEmp)).toBe(false);
  });

  it('permits Admin to view sensitive employee data cross-company', () => {
    const targetEmp = { company_id: 99 };
    expect(can(adminUser, Permissions.EMPLOYEES_VIEW_SENSITIVE, targetEmp)).toBe(true);
  });
});
