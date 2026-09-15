import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const role = await prisma.role.findFirst({ where: { name: 'digital marketing executive' } });
  console.log('role:', role);
  await prisma.$disconnect();
})();
