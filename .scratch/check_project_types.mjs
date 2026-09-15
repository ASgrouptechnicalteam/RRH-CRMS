import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.project.groupBy({ by: ['project_type'], _count: true });
  console.log(rows);
  await prisma.$disconnect();
})();
