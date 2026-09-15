import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const role = await prisma.role.findFirst({ where: { name: 'Digital Marketing head(manager)' } });
  const emps = await prisma.employeeRole.findMany({ where: { role_id: role?.id }, include: { employee: { select: { employee_code: true, id: true } } } });
  console.log('DM Head employees:', emps.map(e => e.employee));
  await prisma.$disconnect();
})();
