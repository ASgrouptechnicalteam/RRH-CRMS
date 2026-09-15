import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE '%ttendanceproposal%'`);
  console.log(rows);
  await prisma.$disconnect();
})();
