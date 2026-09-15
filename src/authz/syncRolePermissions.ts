import { prisma } from '../lib/prisma';
import { RolePermissionsMatrix } from '../shared/auth';
import { logger } from '../utils/logger';

/**
 * Pushes RolePermissionsMatrix (the source of truth in code) into the DB's
 * Role/Permission/RolePermission tables. Purely additive — never revokes a
 * grant, so it's safe to run on every boot. Exists because login reads
 * permissions from the DB, not from this matrix directly (see routes/auth.ts),
 * so adding a permission to a role in code silently does nothing until this
 * runs — that gap previously left PROJECT_MANAGER unable to read/accept
 * Demos for as long as nobody remembered to run the old one-off script by hand.
 */
export async function syncRolePermissions(): Promise<void> {
  const allPermissions = new Set<string>();
  for (const role of Object.keys(RolePermissionsMatrix)) {
    for (const perm of RolePermissionsMatrix[role as keyof typeof RolePermissionsMatrix]) {
      allPermissions.add(perm);
    }
  }

  for (const permName of allPermissions) {
    await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: { name: permName, description: permName },
    });
  }

  for (const roleName of Object.keys(RolePermissionsMatrix)) {
    const permissions = RolePermissionsMatrix[roleName as keyof typeof RolePermissionsMatrix];
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const permName of permissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: role.id, permission_id: permission.id } },
        update: {},
        create: { role_id: role.id, permission_id: permission.id },
      });
    }
  }

  logger.info('[authz] Role permissions synced from RolePermissionsMatrix.');
}
