import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles, RolePermissionsMatrix, Permissions } from '@rrh-ems/shared';

// Reported by the user: the "Reset to Default" button in PermissionsPage.tsx
// called a DELETE endpoint that only wiped a role's RolePermission rows —
// never re-inserted RolePermissionsMatrix's defaults — so "reset" actually
// meant "revoke everything". This suite locks in the real fix: reset must
// restore exactly the canonical default set, and any permission DENY (via
// PATCH or reset) must force affected employees to re-authenticate rather
// than silently persisting via their already-issued JWT for up to 24h.
describe('Admin permissions — reset to defaults & immediate revocation', () => {
  let adminToken: string;
  let telecallerToken: string;
  let telecallerId: number;
  const roleName = Roles.TELECALLER;
  const defaults = RolePermissionsMatrix[roleName];
  const extraPermission = Permissions.PROPERTIES_VERIFY; // deliberately not a Telecaller default

  beforeAll(async () => {
    await setupDeterministicTestUsers();

    const adminUser = deterministicUsers.find((u) => u.roles[0] === Roles.ADMIN)!;
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: adminUser.employee_code, password: 'Password@123' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken;

    const tcUser = deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!;
    const tcLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: tcUser.employee_code, password: 'Password@123' });
    expect(tcLogin.status).toBe(200);
    telecallerToken = tcLogin.body.accessToken;
    telecallerId = tcLogin.body.user.id;
  });

  afterEach(async () => {
    // Always leave the role in its canonical state between tests.
    await request(app)
      .delete(`/api/v1/admin/permissions/${encodeURIComponent(roleName)}/reset`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('a grant-only PATCH does not force existing sessions to re-authenticate', async () => {
    const before = await prisma.employee.findUnique({
      where: { id: telecallerId },
      select: { token_version: true },
    });

    const res = await request(app)
      .patch(`/api/v1/admin/permissions/${encodeURIComponent(roleName)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ granted: [extraPermission] });
    expect(res.status).toBe(200);
    expect(res.body.role.permissions).toContain(extraPermission);

    const after = await prisma.employee.findUnique({
      where: { id: telecallerId },
      select: { token_version: true },
    });
    expect(after!.token_version).toBe(before!.token_version);

    // The telecaller's existing token should still work — a grant must never
    // invalidate sessions, only a deny should.
    const stillWorks = await request(app)
      .get('/api/v1/attendance/my-status')
      .set('Authorization', `Bearer ${telecallerToken}`);
    expect(stillWorks.status).not.toBe(401);
  });

  it('a PATCH that denies a permission bumps token_version and revokes sessions for every employee in that role', async () => {
    const before = await prisma.employee.findUnique({
      where: { id: telecallerId },
      select: { token_version: true },
    });

    const res = await request(app)
      .patch(`/api/v1/admin/permissions/${encodeURIComponent(roleName)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ denied: [Permissions.LEADS_CREATE] });
    expect(res.status).toBe(200);
    expect(res.body.role.permissions).not.toContain(Permissions.LEADS_CREATE);

    const after = await prisma.employee.findUnique({
      where: { id: telecallerId },
      select: { token_version: true },
    });
    expect(after!.token_version).toBe(before!.token_version + 1);

    // The telecaller's old access token is now stale and must be rejected.
    const staleTokenRes = await request(app)
      .get('/api/v1/attendance/my-status')
      .set('Authorization', `Bearer ${telecallerToken}`);
    expect(staleTokenRes.status).toBe(401);
    expect(staleTokenRes.body.code).toBe('TOKEN_EXPIRED');

    // Re-login for subsequent tests/afterEach cleanup.
    const relogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        employee_code: deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!
          .employee_code,
        password: 'Password@123',
      });
    telecallerToken = relogin.body.accessToken;
  });

  it('reset-to-default restores exactly RolePermissionsMatrix, not an empty set', async () => {
    // First corrupt the role: add something extra, remove a real default.
    await request(app)
      .patch(`/api/v1/admin/permissions/${encodeURIComponent(roleName)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ granted: [extraPermission], denied: [Permissions.LEADS_CREATE] });

    const res = await request(app)
      .delete(`/api/v1/admin/permissions/${encodeURIComponent(roleName)}/reset`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.permissionsRestored).toBe(defaults.length);

    const role = await prisma.role.findUnique({
      where: { name: roleName },
      include: { permissions: { include: { permission: true } } },
    });
    const restoredNames = role!.permissions.map((rp) => rp.permission.name).sort();
    expect(restoredNames).toEqual([...defaults].sort());
    // The critical regression this suite exists for: reset must NOT leave
    // the role with zero permissions.
    expect(restoredNames.length).toBeGreaterThan(0);
  });

  it('reset also forces re-authentication for employees holding the role', async () => {
    const relogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        employee_code: deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!
          .employee_code,
        password: 'Password@123',
      });
    const freshToken = relogin.body.accessToken;

    const res = await request(app)
      .delete(`/api/v1/admin/permissions/${encodeURIComponent(roleName)}/reset`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const staleTokenRes = await request(app)
      .get('/api/v1/attendance/my-status')
      .set('Authorization', `Bearer ${freshToken}`);
    expect(staleTokenRes.status).toBe(401);
  });

  it('reset requires MD or ADMIN', async () => {
    const relogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        employee_code: deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!
          .employee_code,
        password: 'Password@123',
      });
    const res = await request(app)
      .delete(`/api/v1/admin/permissions/${encodeURIComponent(roleName)}/reset`)
      .set('Authorization', `Bearer ${relogin.body.accessToken}`);
    expect(res.status).toBe(403);
  });
});
