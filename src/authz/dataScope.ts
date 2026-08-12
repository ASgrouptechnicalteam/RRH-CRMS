import { Prisma } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { Roles } from '@rrh-ems/shared';
import { getDownstreamEmployeeIds } from '../utils/hierarchy';

const MANAGEMENT_ROLES = [
  Roles.MD,
  Roles.ADMIN,
  Roles.HR_MANAGER,
  Roles.MARKETING_DIRECTOR,
  Roles.DIGITAL_LEAD_OPERATOR,
  Roles.DIGITAL_MARKETING_HEAD,
];

/**
 * Ensures company isolation for all scopes, except for System Admins.
 */
function getBaseScope(user: TokenPayload): any {
  if (user.roles.includes(Roles.ADMIN)) {
    return {};
  }
  return { company_id: user.companyId };
}

/**
 * Builds the read-visibility scope for Leads.
 */
export async function buildLeadScope(user: TokenPayload): Promise<Prisma.LeadWhereInput> {
  const baseScope = getBaseScope(user);

  // 1. ADMIN
  if (user.roles.includes(Roles.ADMIN)) {
    return {}; // Global access
  }

  // 2. CHANNEL PARTNER (Must be checked early to prevent global access fallback)
  if (user.roles.includes(Roles.CHANNEL_PARTNER)) {
    return {
      ...baseScope,
      OR: [
        { protection_lock: { cp: { cp_code: user.employeeCode } } },
        // If CP Payouts eventually link to Leads in a way that requires visibility, add it here.
        // Currently, CP Payouts have a lead_id, so we can do:
        // { activities: { some: { actor_id: user.employeeId } } } ? No, payouts are separate.
        // Wait, CPPayout has lead_id. But Prisma doesn't easily do a reverse relation if not defined in Lead.
        // Let's check if Lead has a relation to CPPayout. It doesn't in schema! 
        // So we just use protection_lock.
      ],
    };
  }

  // 3. MANAGEMENT
  const isManagement = user.roles.some((r) => MANAGEMENT_ROLES.includes(r as any));
  if (isManagement) {
    return baseScope; // Entire company leads
  }

  // 4. MANAGERS & TELECALLERS (TEAM / OWN scope)
  const downstreamIds = await getDownstreamEmployeeIds(user.companyId, user.employeeId);
  return {
    ...baseScope,
    OR: [
      { assigned_to_id: { in: downstreamIds } },
      { created_by_id: { in: downstreamIds } },
    ],
  };
}

/**
 * Builds the read-visibility scope for Employees.
 */
export async function buildEmployeeScope(user: TokenPayload): Promise<Prisma.EmployeeWhereInput> {
  const baseScope = getBaseScope(user);

  // 1. ADMIN
  if (user.roles.includes(Roles.ADMIN)) {
    return {}; // Global access
  }

  // 2. CHANNEL PARTNER
  if (user.roles.includes(Roles.CHANNEL_PARTNER)) {
    // CPs get ZERO internal employee records.
    return { id: { in: [] } };
  }

  // Hide system/invisible roles for everyone except Admin
  const invisibleFilter = {
    roles: { none: { role: { is_invisible: true } } },
  };

  // 3. MANAGEMENT
  const isManagement = user.roles.some((r) => [Roles.MD, Roles.HR_MANAGER].includes(r as any));
  if (isManagement) {
    return {
      ...baseScope,
      ...invisibleFilter,
    };
  }

  // 4. MANAGERS (TEAM scope) & STANDARD EMPLOYEES
  const downstreamIds = await getDownstreamEmployeeIds(user.companyId, user.employeeId);
  return {
    ...baseScope,
    ...invisibleFilter,
    id: { in: downstreamIds },
  };
}

/**
 * Builds the read-visibility scope for Properties.
 */
export async function buildPropertyScope(user: TokenPayload): Promise<Prisma.PropertyWhereInput> {
  const baseScope = getBaseScope(user);

  // 1. ADMIN & MANAGEMENT
  const isManagement = user.roles.some((r) => MANAGEMENT_ROLES.includes(r as any));
  if (user.roles.includes(Roles.ADMIN) || isManagement) {
    return baseScope;
  }

  // 2. PROJECT MANAGER
  if (user.roles.includes(Roles.PROJECT_MANAGER)) {
    return {
      ...baseScope,
      OR: [
        { assigned_pm_id: user.employeeId },
        { status: 'LIVE' },
      ],
    };
  }

  // 3. TELECALLER, AGENT, CHANNEL PARTNER
  // Default to LIVE properties only within their company.
  return {
    ...baseScope,
    status: 'LIVE',
  };
}

/**
 * Builds the read-visibility scope for Customers.
 */
export async function buildCustomerScope(user: TokenPayload): Promise<Prisma.CustomerWhereInput> {
  const baseScope = getBaseScope(user);

  if (user.roles.includes(Roles.ADMIN)) {
    return {};
  }

  const isManagement = user.roles.some((r) => MANAGEMENT_ROLES.includes(r as any));
  if (isManagement) {
    return baseScope;
  }

  const isProjectManager = user.roles.includes(Roles.PROJECT_MANAGER);
  if (isProjectManager) {
    return baseScope;
  }

  // Telecallers and Agents only see their assigned customers.
  return {
    ...baseScope,
    assigned_to_id: user.employeeId,
  };
}
