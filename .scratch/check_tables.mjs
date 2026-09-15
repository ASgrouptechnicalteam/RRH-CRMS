import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE '%mploye%'`);
  console.log(rows);
  const rows2 = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE '%roject%'`);
  console.log(rows2);
  await prisma.$disconnect();
})();
