import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { generateQrHmac } from '../../apps/api/src/utils/qr';
import { getISTComponents } from '../../apps/api/src/utils/time';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';

const p = prisma as any;

describe('Attendance Kiosk End-to-End (Backend) — Kiosk Credential Auth', () => {
  let kioskToken: string;
  let kioskCredentialId: number;
  let kioskBranchId: number;
  let kioskBranchName: string;
  let employee1Id: number;
  let employee1Code: string;
  let kioskCompanyId: number;

  let employee2Id: number; // Company 2

  beforeAll(async () => {
    await setupDeterministicTestUsers();

    // 1. Create a kiosk credential for the admin's company/branch
    const adminUser = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-001' } });
    kioskCompanyId = adminUser.company_id;

    const mainBranch = await p.branch.findFirst({
      where: { company_id: kioskCompanyId, name: 'Miyapur (Main Branch)' },
    });
    if (!mainBranch) {
      throw new Error('Main branch not found for deterministic test users');
    }
    kioskBranchId = mainBranch.id;
    kioskBranchName = mainBranch.name;

    const credRes = await request(app)
      .post('/api/v1/kiosk-credentials')
      .set('Authorization', `Bearer ${await getAdminToken()}`)
      .send({
        branch_id: kioskBranchId,
        label: 'Kiosk Test Credential',
        username: 'KIOSK-TEST-001',
        password: 'Kiosk@123',
      });
    expect(credRes.status).toBe(201);
    kioskCredentialId = credRes.body.credential.id;

    // 2. Login as the kiosk credential
    const loginRes = await request(app)
      .post('/api/v1/kiosk-auth/login')
      .send({ username: 'KIOSK-TEST-001', password: 'Kiosk@123' });
    expect(loginRes.status).toBe(200);
    kioskToken = loginRes.body.accessToken;

    // 3. Get Employee 1 (same company as kiosk credential)
    const emp1 = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-003' } });
    employee1Id = emp1.id;
    employee1Code = emp1.employee_code;

    // 4. Get Employee 2 (Company 2)
    const emp2 = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-999' } });
    employee2Id = emp2.id;
  });

  const getAdminToken = async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: 'RRH-TST-001', password: 'Password@123' });
    return res.body.accessToken;
  };

  afterAll(async () => {
    // Clean up test data
    if (kioskCredentialId) {
      await p.kioskCredential.delete({ where: { id: kioskCredentialId } }).catch(() => {});
    }
    await p.attendanceLog.deleteMany({
      where: { employee_id: { in: [employee1Id, employee2Id] } },
    }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Kiosk login — POST /kiosk-auth/login', () => {
    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: 'KIOSK-TEST-001', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid kiosk credentials');
    });

    it('should reject deactivated credential', async () => {
      // Deactivate
      await request(app)
        .patch(`/api/v1/kiosk-credentials/${kioskCredentialId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ is_active: false });

      const res = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: 'KIOSK-TEST-001', password: 'Kiosk@123' });
      expect(res.status).toBe(401);

      // Re-activate for remaining tests
      await request(app)
        .patch(`/api/v1/kiosk-credentials/${kioskCredentialId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ is_active: true });
    });
  });

  describe('Check-in via POST /scan (kiosk token)', () => {
    beforeEach(async () => {
      await p.attendanceLog.deleteMany({ where: { employee_id: employee1Id } });
    });

    it('should reject scan with no Authorization header (401)', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const res = await request(app)
        .post('/api/v1/attendance/scan')
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken,
          },
        });
      expect(res.status).toBe(401);
    });

    it('should reject scan with an employee JWT (not KIOSK type)', async () => {
      const adminToken = await getAdminToken();
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const res = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken,
          },
        });
      expect(res.status).toBe(401);
    });

    it('should reject a QR code from a different company (Tenant Isolation)', async () => {
      const qrToken = generateQrHmac(employee2Id, 'RRH-TST-999', 1);
      const res = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${kioskToken}`)
        .send({
          qrPayload: {
            employeeId: employee2Id,
            employeeCode: 'RRH-TST-999',
            version: 1,
            signedToken: qrToken,
          },
        });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Employee does not belong to your company');
    });

    it('should successfully check in an employee and populate branch_id', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const res = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${kioskToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken,
          },
        });
      expect(res.status).toBe(200);
      expect(res.body.alreadyStamped).toBe(false);

      // Verify the log was created for EMPLOYEE 1 and has branch_id set
      const log = await p.attendanceLog.findFirst({ where: { employee_id: employee1Id } });
      expect(log).toBeDefined();
      expect(log.check_out_at).toBeNull();
      expect(log.branch_id).toBe(kioskBranchId);
    });

    it('should prevent concurrent duplicate check-ins (Race condition protection)', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const payload = {
        qrPayload: {
          employeeId: employee1Id,
          employeeCode: employee1Code,
          version: 1,
          signedToken: qrToken,
        },
      };

      const req1 = request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${kioskToken}`).send(payload);
      const req2 = request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${kioskToken}`).send(payload);

      const [res1, res2] = await Promise.all([req1, req2]);

      const successCount = [res1.status, res2.status].filter(s => s === 200).length;
      expect(successCount).toBe(2); // One is check-in, one is "Already checked in"

      const logs = await p.attendanceLog.findMany({ where: { employee_id: employee1Id } });
      expect(logs.length).toBe(1); // Only 1 physical record inserted!
    });

    it('should attach the kiosk branch_id to the attendance log', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${kioskToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken,
          },
        });

      const log = await p.attendanceLog.findFirst({ where: { employee_id: employee1Id } });
      expect(log.branch_id).toBe(kioskBranchId);
    });
  });

  describe('Check-out via POST /checkout (kiosk token)', () => {
    beforeEach(async () => {
      await p.attendanceLog.deleteMany({ where: { employee_id: employee1Id } });
    });

    it('should reject checkout with no token (401)', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken,
          },
        });
      expect(res.status).toBe(401);
    });

    it('should reject checkout with an employee JWT (not KIOSK type)', async () => {
      const adminToken = await getAdminToken();
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken,
          },
        });
      expect(res.status).toBe(401);
    });

    it('should reject checkout if no active check-in exists', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${kioskToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken,
          },
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No active check-in found for today');
    });

    it('should successfully checkout and calculate duration, populating branch_id', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);

      // Manually create a check-in from 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await p.attendanceLog.create({
        data: {
          employee_id: employee1Id,
          check_in_at: twoHoursAgo,
          status: 'PRESENT',
          source: 'QR_SCAN',
          branch_id: kioskBranchId,
        },
      });

      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${kioskToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.working_duration_minutes).toBeGreaterThanOrEqual(119);
      expect(res.body.working_duration_minutes).toBeLessThanOrEqual(121);

      const log = await p.attendanceLog.findFirst({ where: { employee_id: employee1Id } });
      expect(log.check_out_at).not.toBeNull();
      expect(log.working_duration_minutes).toBe(res.body.working_duration_minutes);
      expect(log.branch_id).toBe(kioskBranchId);
    });
  });

  describe('Credential version mismatch kills active session', () => {
    it('should 401 when credential_version in token does not match DB', async () => {
      // Rotate password — this increments credential_version
      const rotateRes = await request(app)
        .patch(`/api/v1/kiosk-credentials/${kioskCredentialId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ password: 'Kiosk@456' });
      expect(rotateRes.status).toBe(200);
      expect(rotateRes.body.credential.credential_version).toBe(2);

      // Old token should now be rejected
      const res = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${kioskToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: generateQrHmac(employee1Id, employee1Code, 1),
          },
        });
      expect(res.status).toBe(401);

      // Login with new password gets a fresh token with version 2
      const newLoginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: 'KIOSK-TEST-001', password: 'Kiosk@456' });
      expect(newLoginRes.status).toBe(200);
      const newToken = newLoginRes.body.accessToken;

      // New token should work
      const workingRes = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: generateQrHmac(employee1Id, employee1Code, 1),
          },
        });
      expect(workingRes.status).toBe(200);
    });
  });

  describe('POST /kiosk-credentials — CRUD', () => {
    let newCredId: number;

    it('should create a new kiosk credential', async () => {
      const res = await request(app)
        .post('/api/v1/kiosk-credentials')
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({
          branch_id: kioskBranchId,
          label: 'Front Desk — Test Branch',
          username: 'KIOSK-NEW-001',
          password: 'Kiosk@789',
        });
      expect(res.status).toBe(201);
      expect(res.body.credential.label).toBe('Front Desk — Test Branch');
      expect(res.body.credential.username).toBe('KIOSK-NEW-001');
      expect(res.body.credential.branch_name).toBe(kioskBranchName);
      expect(res.body.credential.is_active).toBe(true);
      expect(res.body.credential.credential_version).toBe(1);
      newCredId = res.body.credential.id;
    });

    it('should reject duplicate username in same company', async () => {
      const res = await request(app)
        .post('/api/v1/kiosk-credentials')
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({
          branch_id: kioskBranchId,
          label: 'Duplicate',
          username: 'KIOSK-TEST-001',
          password: 'Kiosk@000',
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Username already exists');
    });

    it('should list credentials with branch names', async () => {
      const res = await request(app)
        .get('/api/v1/kiosk-credentials')
        .set('Authorization', `Bearer ${await getAdminToken()}`);
      expect(res.status).toBe(200);
      const creds = res.body.credentials;
      expect(creds.length).toBeGreaterThanOrEqual(2); // the original + the new one
      const found = creds.find(c => c.id === newCredId);
      expect(found).toBeDefined();
      expect(found.branch_name).toBe(kioskBranchName);
      expect(found).not.toHaveProperty('password_hash');
    });

    it('should update label and branch', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/kiosk-credentials/${newCredId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({
          label: 'Updated Label',
          branch_id: kioskBranchId,
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.credential.label).toBe('Updated Label');
      expect(updateRes.body.credential.credential_version).toBe(1); // no password/active change = no bump
    });

    it('should bump credential_version on password change', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/kiosk-credentials/${newCredId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ password: 'NewKiosk@123' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.credential.credential_version).toBe(2);

      // Old token should be rejected
      const oldLoginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: 'KIOSK-NEW-001', password: 'Kiosk@789' });
      expect(oldLoginRes.status).toBe(401);

      // New password works
      const newLoginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: 'KIOSK-NEW-001', password: 'NewKiosk@123' });
      expect(newLoginRes.status).toBe(200);
    });

    it('should deactivate and reactivate', async () => {
      const deactRes = await request(app)
        .patch(`/api/v1/kiosk-credentials/${newCredId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ is_active: false });
      expect(deactRes.status).toBe(200);
      expect(deactRes.body.credential.is_active).toBe(false);
      expect(deactRes.body.credential.credential_version).toBe(3); // active toggle bumps version

      // Login should fail
      const loginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: 'KIOSK-NEW-001', password: 'NewKiosk@123' });
      expect(loginRes.status).toBe(401);

      // Re-activate
      const reactRes = await request(app)
        .patch(`/api/v1/kiosk-credentials/${newCredId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ is_active: true });
      expect(reactRes.status).toBe(200);
      expect(reactRes.body.credential.is_active).toBe(true);
      expect(reactRes.body.credential.credential_version).toBe(4);
    });

    it('should reject creating credential for a branch in a different company', async () => {
      const company2User = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-999' } });
      const company2Branch = await p.branch.findFirst({
        where: { company_id: company2User.company_id },
      });
      if (!company2Branch) {
        throw new Error('No branch found for company 2');
      }
      const res = await request(app)
        .post('/api/v1/kiosk-credentials')
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({
          branch_id: company2Branch.id,
          label: 'Cross-company attempt',
          username: 'KIOSK-XCOMP-001',
          password: 'Kiosk@000',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Branch does not belong to your company');
    });
  });
});
