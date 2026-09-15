import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const existing = await prisma.employee.findFirst({ where: { employee_code: 'RRH-DM-TEST-1' } });
  if (existing) {
    console.log('already exists:', existing.id);
    await prisma.$disconnect();
    return;
  }
  const emp = await prisma.employee.create({
    data: {
      employee_code: 'RRH-DM-TEST-1',
      full_name: 'Phase17 DM Test',
      phone: '9' + Math.floor(100000000 + Math.random()*899999999),
      company_id: 1,
      branch_id: 2,
      password_hash: '$2b$10$abcdefghijklmnopqrstuv', // not used for login in this test
    },
  });
  const role = await prisma.role.findFirst({ where: { name: 'digital marketing executive' } });
  await prisma.employeeRole.create({ data: { employee_id: emp.id, role_id: role.id } });
  console.log('created:', emp.id);
  await prisma.$disconnect();
})();
