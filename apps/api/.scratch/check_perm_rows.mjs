import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.permission.findMany({ where: { name: { contains: 'project' } } });
  console.log(rows.map(r => r.name));
  await prisma.$disconnect();
})();
