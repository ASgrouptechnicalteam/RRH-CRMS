import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// The 13 authoritative roles defined by the Phase 0 audit
export const TEST_ROLES = [
  'MD',
  'ADMIN',
  'MARKETING_DIRECTOR',
  'PROJECT_MANAGER',
  'DIGITAL_LEAD_OPERATOR',
  'TELECALLER',
  'CHANNEL_PARTNER_MANAGER',
  'DIGITAL_MARKETING_HEAD',
  'HR_MANAGER',
  'FINANCE',
  'AGENT',
  'CHANNEL_PARTNER',
  'DIGITAL_MARKETING_EXECUTIVE'
];

// We define raw deterministic data so tests can predict exactly what exists
export const deterministicUsers = TEST_ROLES.map((role, idx) => ({
  employee_code: `TEST-${role}`,
  name: `Test ${role}`,
  email: `test-${role.toLowerCase()}@example.com`,
  phone: `+919999999${idx.toString().padStart(3, '0')}`,
  password: 'Password@123',
  roles: [role],
  pan_number: 'ABCDE1234F', // Sensitive field for testing SF-005
  salary_ctc: 1000000, // Sensitive field
  department: role === 'FINANCE' ? 'FINANCE' : 'OPERATIONS'
}));

export const crossOrgUsers = [
  {
    employee_code: 'TEST-TELECALLER-ORG-B',
    name: 'Test Telecaller Org B',
    email: 'test-telecaller-org-b@example.com',
    phone: '+918888888001',
    password: 'Password@123',
    roles: ['TELECALLER'],
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

  for (const user of allUsers) {
    // Only created in tests, safe deterministic setup
    await prisma.employee.upsert({
      where: { employee_code: user.employee_code },
      update: {},
      create: {
        employee_code: user.employee_code,
        full_name: user.name, // Prisma uses full_name instead of name based on schema error
        email: user.email,
        phone: user.phone,
        password_hash: hashedPassword,
        company: {
          connect: { id: testCompany.id }
        },
        roles: {
          create: user.roles.map((roleName) => ({
            role: {
              connectOrCreate: {
                where: { name: roleName },
                create: { name: roleName }
              }
            }
          }))
        },
        pan_number: user.pan_number,
        salary_ctc: user.salary_ctc,
        department: user.department,
        job_title: `Test ${user.roles[0]}` // Prisma uses job_title instead of designation
      }
    });
  }
}
