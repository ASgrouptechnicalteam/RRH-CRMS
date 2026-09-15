import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const roleNames = ['Managing director', 'Admin (Technical)', 'Digital Marketing head(manager)', 'digital marketing executive'];
  const permNames = ['projects.submit_verify', 'projects.verify', 'projects.dm_polish'];
  for (const roleName of roleNames) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) { console.log('no role:', roleName); continue; }
    for (const permName of permNames) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: role.id, permission_id: perm.id } },
        update: {},
        create: { role_id: role.id, permission_id: perm.id },
      });
    }
    console.log('granted for', roleName);
  }
  await prisma.$disconnect();
})();
