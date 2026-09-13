import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles, Permissions, RolePermissionsMatrix } from '@rrh-ems/shared';

// Item #11 from the user's manual QA pass: grant/revoke ONE permission for a
// single employee without touching their whole role. The backend already
// merged EmployeePermissionOverride into the JWT at every token-minting site
// in routes/auth.ts before this suite was written — only a management route
// was missing. This locks in: grant/revoke/clear all work, a revoke forces
// re-authentication (an already-issued JWT still carries the permission
// otherwise), and a grant does not disrupt existing sessions.
describe('Employee-level permission overrides', () => {
  let adminToken: string;
  let telecallerToken: string;
  let telecallerId: number;
  const roleName = Roles.TELECALLER;
  const extraPermission = Permissions.PROPERTIES_VERIFY; // not a Telecaller default
  const removablePermission = RolePermissionsMatrix[roleName][0]; // a real default to revoke

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
    // Leave the employee override-free between tests.
    await prisma.employeePermissionOverride.deleteMany({ where: { employee_id: telecallerId } });
  });

  it('grants an extra permission and it appears in the employee JWT after refresh', async () => {
    const res = await request(app)
      .put(`/api/v1/employees/${telecallerId}/permission-overrides`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permission: extraPermission, is_granted: true });
    expect(res.status).toBe(200);

    const relogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        employee_code: deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!
          .employee_code,
        password: 'Password@123',
      });
    expect(relogin.body.user.permissions).toContain(extraPermission);
  });

  it("a grant does not disrupt the employee's existing session", async () => {
    const before = await prisma.employee.findUnique({
      where: { id: telecallerId },
      select: { token_version: true },
    });

    const res = await request(app)
      .put(`/api/v1/employees/${telecallerId}/permission-overrides`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permission: extraPermission, is_granted: true });
    expect(res.status).toBe(200);

    const after = await prisma.employee.findUnique({
      where: { id: telecallerId },
      select: { token_version: true },
    });
    expect(after!.token_version).toBe(before!.token_version);

    const stillWorks = await request(app)
      .get('/api/v1/attendance/my-status')
      .set('Authorization', `Bearer ${telecallerToken}`);
    expect(stillWorks.status).not.toBe(401);
  });

  it('revoking a permission the role would otherwise grant forces re-authentication', async () => {
    const res = await request(app)
      .put(`/api/v1/employees/${telecallerId}/permission-overrides`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permission: removablePermission, is_granted: false });
    expect(res.status).toBe(200);

    const staleTokenRes = await request(app)
      .get('/api/v1/attendance/my-status')
      .set('Authorization', `Bearer ${telecallerToken}`);
    expect(staleTokenRes.status).toBe(401);

    const relogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        employee_code: deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!
          .employee_code,
        password: 'Password@123',
      });
    expect(relogin.body.user.permissions).not.toContain(removablePermission);
    telecallerToken = relogin.body.accessToken;
  });

  it('clearing an override reverts to the role default and lists correctly via GET', async () => {
    await request(app)
      .put(`/api/v1/employees/${telecallerId}/permission-overrides`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permission: extraPermission, is_granted: true });

    const listRes = await request(app)
      .get(`/api/v1/employees/${telecallerId}/permission-overrides`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.overrides).toEqual([{ permission: extraPermission, is_granted: true }]);

    const clearRes = await request(app)
      .delete(
        `/api/v1/employees/${telecallerId}/permission-overrides/${encodeURIComponent(extraPermission)}`,
      )
      .set('Authorization', `Bearer ${adminToken}`);
    expect(clearRes.status).toBe(200);

    const listAfter = await request(app)
      .get(`/api/v1/employees/${telecallerId}/permission-overrides`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listAfter.body.overrides).toEqual([]);

    // Clearing also forces re-authentication (see the route's comment), so
    // refresh the shared token for the next test.
    const relogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        employee_code: deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!
          .employee_code,
        password: 'Password@123',
      });
    telecallerToken = relogin.body.accessToken;
  });

  it('requires MD or ADMIN to set an override', async () => {
    const res = await request(app)
      .put(`/api/v1/employees/${telecallerId}/permission-overrides`)
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({ permission: extraPermission, is_granted: true });
    expect(res.status).toBe(403);
  });
});
