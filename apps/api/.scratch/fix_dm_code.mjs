import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  await prisma.employee.update({ where: { id: 8884345 }, data: { employee_code: 'RRH-MK-9999' } });
  console.log('updated');
  await prisma.$disconnect();
})();
