import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.project.groupBy({ by: ['verification_status'], _count: true });
  console.log(rows);
  await prisma.$disconnect();
})();
