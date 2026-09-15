import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM project WHERE Field = 'project_type'`);
  console.log(rows);
  await prisma.$disconnect();
})();
