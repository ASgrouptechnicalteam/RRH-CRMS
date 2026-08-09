import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Roles, Permissions, RolePermissionsMatrix } from '@rrh-ems/shared';

const prisma = new PrismaClient();

// The 13 authoritative roles defined by the Phase 0 audit (using their canonical names)
export const TEST_ROLES = [
  Roles.MD,
  Roles.ADMIN,
  Roles.MARKETING_DIRECTOR,
  Roles.PROJECT_MANAGER,
  Roles.DIGITAL_LEAD_OPERATOR,
  Roles.TELECALLER,
  Roles.CHANNEL_PARTNER_MANAGER,
  Roles.DIGITAL_MARKETING_HEAD,
  Roles.HR_MANAGER,
  Roles.FINANCE,
  Roles.AGENT,
  Roles.CHANNEL_PARTNER,
  Roles.DIGITAL_MARKETING_EXECUTIVE
];

// We define raw deterministic data so tests can predict exactly what exists
export const deterministicUsers = TEST_ROLES.map((role, idx) => ({
  employee_code: `RRH-TST-${String(idx).padStart(3, '0')}`,
  name: `Test ${role}`,
  email: `test-${role.toLowerCase()}@example.com`,
  phone: `+919999999${idx.toString().padStart(3, '0')}`,
  password: 'Password@123',
  roles: [role],
  pan_number: 'ABCDE1234F', // Sensitive field for testing SF-005
  salary_ctc: 1000000, // Sensitive field
  department: role === Roles.FINANCE ? 'FINANCE' : 'OPERATIONS'
}));

export const crossOrgUsers = [
  {
    employee_code: 'RRH-TST-999',
    name: 'Test Telecaller Org B',
    email: 'test-telecaller-org-b@example.com',
    phone: '+918888888001',
    password: 'Password@123',
    roles: [Roles.TELECALLER],
    department: 'OPERATIONS',
    pan_number: 'XYZDE1234F',
    salary_ctc: 500000
  }
];

export async function setupDeterministicTestUsers() {
  // Safety Guard: Do not run against production database!
  if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
    throw new Error("ABORT: Test safety guard triggered. Requires NODE_ENV=test AND DATABASE_URL_TEST. Do not run against production!");
  }

  const hashedPassword = await bcrypt.hash('Password@123', 12);

  // Create or upsert a deterministic test Company for Phase 0
  const testCompany = await prisma.company.upsert({
    where: { code: 'TEST_COMP_01' },
    update: {},
    create: {
      name: 'Test Company',
      code: 'TEST_COMP_01'
    }
  });

  const allUsers = [...deterministicUsers, ...crossOrgUsers];

  await Promise.all(
    allUsers.map((user) =>
      prisma.employee.upsert({
        where: { employee_code: user.employee_code },
        update: {},
        create: {
          employee_code: user.employee_code,
          full_name: user.name,
          email: user.email,
          phone: user.phone,
          password_hash: hashedPassword,
          company: {
            connect: { id: testCompany.id },
          },
          roles: {
            create: user.roles.map((roleName) => ({
              role: {
                connectOrCreate: {
                  where: { name: roleName },
                  create: { name: roleName },
                },
              },
            })),
          },
          pan_number: user.pan_number,
          salary_ctc: user.salary_ctc,
          department: user.department,
          job_title: `Test ${user.roles[0]}`,
        },
      })
    )
  );

  // --- Phase 1 Stage 2: Sync RolePermissionsMatrix into Test DB ---
  const allPerms = Object.values(Permissions).filter((p) => typeof p === 'string') as string[];
  
  // Create permissions efficiently if they don't exist
  await prisma.permission.createMany({
    data: allPerms.map((permName) => ({ name: permName })),
    skipDuplicates: true
  });

  // Fetch all roles and permissions once
  const [allRoles, allDbPerms] = await Promise.all([
    prisma.role.findMany(),
    prisma.permission.findMany()
  ]);
  
  const roleMap = new Map(allRoles.map(r => [r.name, r.id]));
  const permMap = new Map(allDbPerms.map(p => [p.name, p.id]));

  // Build the list of required RolePermission pairs
  const rolePermsData: { role_id: number; permission_id: number }[] = [];
  for (const [roleName, permissions] of Object.entries(RolePermissionsMatrix)) {
    const roleId = roleMap.get(roleName);
    if (roleId && Array.isArray(permissions)) {
      for (const perm of permissions) {
        const permId = permMap.get(perm);
        if (permId) {
          rolePermsData.push({ role_id: roleId, permission_id: permId });
        }
      }
    }
  }

  // Instead of deleteMany which causes cross-test race conditions,
  // we efficiently createMany with skipDuplicates.
  if (rolePermsData.length > 0) {
    await prisma.rolePermission.createMany({
      data: rolePermsData,
      skipDuplicates: true
    });
  }
}
