import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const emp = await prisma.employee.findFirst({ where: { employee_code: 'RRH-MK-9999' } });
  console.log({ id: emp?.id, phone: emp?.phone, current_address: emp?.current_address, bank_name: emp?.bank_name });
  await prisma.$disconnect();
})();
