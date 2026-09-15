import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const role = await prisma.role.findFirst({ where: { name: 'Managing director' } });
  const perms = await prisma.rolePermission.findMany({
    where: { role_id: role.id, permission: { name: { contains: 'project' } } },
    include: { permission: true },
  });
  console.log(perms.map(p => p.permission.name));
  await prisma.$disconnect();
})();
