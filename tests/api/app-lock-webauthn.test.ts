import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';
import { WebAuthnService } from '../../apps/api/src/services/webauthn.service';

// § Phase 6 — a real WebAuthn ceremony (navigator.credentials.create/get)
// needs an actual browser + authenticator (or a CDP virtual authenticator)
// and can't be meaningfully simulated in a Jest/Node unit test — that part
// needs the manual browser verification the plan itself calls for (at least
// one Windows Hello device, one phone-class device). This file covers
// everything that CAN be verified without a real ceremony: route auth
// gating, credential CRUD, and the honest-failure paths.
describe('Phase 6 - App Lock (WebAuthn) — route gating & credential lifecycle', () => {
  let mdToken: string;
  let mdId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    const mdUser = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!;
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.20.1')
      .send({ employee_code: mdUser.employee_code, password: 'Password@123' });
    expect(login.status).toBe(200);
    mdToken = login.body.accessToken;
    mdId = login.body.user.id;
  });

  afterEach(async () => {
    await prisma.webAuthnCredential.deleteMany({ where: { employee_id: mdId } });
  });

  it('registration endpoints reject requests with no access token', async () => {
    const optionsRes = await request(app).post('/api/v1/auth/app-lock/register-options');
    expect(optionsRes.status).toBe(401);

    const verifyRes = await request(app)
      .post('/api/v1/auth/app-lock/register-verify')
      .send({ response: {} });
    expect(verifyRes.status).toBe(401);
  });

  it('status reports disabled with no registered credentials, then enabled once one exists', async () => {
    const before = await request(app)
      .get('/api/v1/auth/app-lock/status')
      .set('Authorization', `Bearer ${mdToken}`);
    expect(before.status).toBe(200);
    expect(before.body.enabled).toBe(false);
    expect(before.body.credentials).toEqual([]);

    await prisma.webAuthnCredential.create({
      data: {
        employee_id: mdId,
        credential_id: `test-cred-${Date.now()}`,
        public_key: 'ZmFrZQ',
        counter: 0,
        device_label: 'Test Device',
      },
    });

    const after = await request(app)
      .get('/api/v1/auth/app-lock/status')
      .set('Authorization', `Bearer ${mdToken}`);
    expect(after.status).toBe(200);
    expect(after.body.enabled).toBe(true);
    expect(after.body.credentials.length).toBe(1);
    expect(after.body.credentials[0].device_label).toBe('Test Device');
    // Never exposes the public key or raw counter to the client.
    expect(after.body.credentials[0].public_key).toBeUndefined();
  });

  it('register-options returns a real challenge and excludes already-registered credentials', async () => {
    const existing = await prisma.webAuthnCredential.create({
      data: {
        employee_id: mdId,
        credential_id: `existing-cred-${Date.now()}`,
        public_key: 'ZmFrZQ',
        counter: 0,
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/app-lock/register-options')
      .set('Authorization', `Bearer ${mdToken}`);
    expect(res.status).toBe(200);
    expect(res.body.challenge).toBeDefined();
    expect(res.body.excludeCredentials.some((c: any) => c.id === existing.credential_id)).toBe(
      true,
    );
  });

  it("a second employee cannot delete another employee's registered device", async () => {
    const cred = await prisma.webAuthnCredential.create({
      data: {
        employee_id: mdId,
        credential_id: `owned-by-md-${Date.now()}`,
        public_key: 'ZmFrZQ',
        counter: 0,
      },
    });

    const tcUser = deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!;
    const tcLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.20.2')
      .send({ employee_code: tcUser.employee_code, password: 'Password@123' });
    const tcToken = tcLogin.body.accessToken;

    const res = await request(app)
      .delete(`/api/v1/auth/app-lock/credentials/${cred.id}`)
      .set('Authorization', `Bearer ${tcToken}`);
    expect(res.status).toBe(404);

    const stillThere = await prisma.webAuthnCredential.findUnique({ where: { id: cred.id } });
    expect(stillThere).not.toBeNull();
  });

  it('unlock-options is unauthenticated but returns 404 for an employee with no registered device', async () => {
    const res = await request(app)
      .post('/api/v1/auth/app-lock/unlock-options')
      .send({ employeeId: mdId });
    expect(res.status).toBe(404);
  });

  it('unlock-options returns a real challenge once a device is registered, without requiring a Bearer token', async () => {
    await prisma.webAuthnCredential.create({
      data: {
        employee_id: mdId,
        credential_id: `unlock-cred-${Date.now()}`,
        public_key: 'ZmFrZQ',
        counter: 0,
      },
    });
    const res = await request(app)
      .post('/api/v1/auth/app-lock/unlock-options')
      .send({ employeeId: mdId });
    expect(res.status).toBe(200);
    expect(res.body.challenge).toBeDefined();
  });

  it('unlock-verify rejects a response for an unrecognized credential id', async () => {
    await prisma.webAuthnCredential.create({
      data: {
        employee_id: mdId,
        credential_id: `real-cred-${Date.now()}`,
        public_key: 'ZmFrZQ',
        counter: 0,
      },
    });
    // Must generate real options first so a pending challenge exists to consume.
    await request(app).post('/api/v1/auth/app-lock/unlock-options').send({ employeeId: mdId });

    const res = await request(app)
      .post('/api/v1/auth/app-lock/unlock-verify')
      .send({
        employeeId: mdId,
        response: {
          id: 'totally-unknown-credential-id',
          rawId: 'x',
          response: {},
          type: 'public-key',
        },
      });
    expect(res.status).toBe(400);
  });

  it('unlock-verify 404s for an inactive/nonexistent employeeId (no account enumeration via 401 vs 404 distinction beyond this)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/app-lock/unlock-verify')
      .send({
        employeeId: 999999999,
        response: { id: 'x', rawId: 'x', response: {}, type: 'public-key' },
      });
    expect(res.status).toBe(404);
  });

  describe('WebAuthnService unit-level behavior', () => {
    it('hasAppLockEnabled reflects whether any credential is registered', async () => {
      expect(await WebAuthnService.hasAppLockEnabled(mdId)).toBe(false);
      await prisma.webAuthnCredential.create({
        data: {
          employee_id: mdId,
          credential_id: `svc-cred-${Date.now()}`,
          public_key: 'ZmFrZQ',
          counter: 0,
        },
      });
      expect(await WebAuthnService.hasAppLockEnabled(mdId)).toBe(true);
    });

    it('deleteCredential throws 404 for a credential belonging to someone else', async () => {
      const otherEmployee = await prisma.employee.findFirst({ where: { id: { not: mdId } } });
      const cred = await prisma.webAuthnCredential.create({
        data: {
          employee_id: mdId,
          credential_id: `svc-owned-${Date.now()}`,
          public_key: 'ZmFrZQ',
          counter: 0,
        },
      });
      await expect(
        WebAuthnService.deleteCredential(otherEmployee!.id, cred.id),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
