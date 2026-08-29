import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { generateQrHmac } from '../../apps/api/src/utils/qr';
import { getISTComponents } from '../../apps/api/src/utils/time';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';
import { resetKioskAuthState } from '../../apps/api/src/middleware/auth';

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
  const uniqueSuffix = `RUN-${process.pid}`;

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
    // The CRUD section creates additional credentials — clean them up too.
    // We cannot reference newCredId directly (it lives in a nested describe scope),
    // so we delete by the run-unique username pattern instead.
    const runCreds = await p.kioskCredential.findMany({
      where: { username: { startsWith: `KIOSK-NEW-${uniqueSuffix}` } },
    });
    for (const c of runCreds) {
      await p.kioskCredential.delete({ where: { id: c.id } }).catch(() => {});
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

      // Re-activate for remaining tests AND re-login to get a fresh token
      // (the deactivate/reactivate cycle bumps credential_version twice).
      await request(app)
        .patch(`/api/v1/kiosk-credentials/${kioskCredentialId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ is_active: true });

      const reLoginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: 'KIOSK-TEST-001', password: 'Kiosk@123' });
      expect(reLoginRes.status).toBe(200);
      kioskToken = reLoginRes.body.accessToken;
    });
  });

  describe('Check-in via POST /scan (kiosk token)', () => {
    beforeEach(async () => {
      await p.attendanceLog.deleteMany({ where: { employee_id: employee1Id } });
      await p.dailyReport.deleteMany({ where: { employee_id: employee1Id } });

      // Submit a daily report for employee 1 so the report_required gate
      // (Phase 5 logout gate) does not block any checkout that follows a scan.
      const emp1Token = await request(app)
        .post('/api/v1/auth/login')
        .send({ employee_code: employee1Code, password: 'Password@123' })
        .then((r) => r.body.accessToken);

      if (emp1Token) {
        await request(app)
          .post('/api/v1/reports/daily')
          .set('Authorization', `Bearer ${emp1Token}`)
          .send({
            role_name: 'Telecaller',
            metrics: { callsMade: 5, siteVisits: 2, leadsQualified: 1 },
            summary_notes: 'Scan test daily report',
            target_met: true,
          });
      }
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
      // Debug: confirm kioskToken version matches DB
      const cred = await p.kioskCredential.findUnique({ where: { id: kioskCredentialId } });
      console.log('[DEBUG scan] kioskCredential version:', cred?.credential_version);

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
      const errorCount = [res1.status, res2.status].filter(s => s === 400).length;
      expect(successCount).toBe(1); // One is successful check-in
      expect(errorCount).toBe(1); // The other gets the 16-hour active check-in error

      const logs = await p.attendanceLog.findMany({ where: { employee_id: employee1Id } });
      expect(logs.length).toBe(1); // Only 1 physical record inserted!
    });

    it('should reject duplicate scan-in within 16 hours', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const payload = { qrPayload: { employeeId: employee1Id, employeeCode: employee1Code, version: 1, signedToken: qrToken } };
      
      // First scan
      await request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${kioskToken}`).send(payload);
      
      // Second scan immediately
      const res2 = await request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${kioskToken}`).send(payload);
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('You are already checked in. Did you mean to check out?');
    });

    it('should auto-close check-in older than 16 hours and allow new scan', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const payload = { qrPayload: { employeeId: employee1Id, employeeCode: employee1Code, version: 1, signedToken: qrToken } };
      
      const seventeenHoursAgo = new Date(Date.now() - 17 * 60 * 60 * 1000);
      await p.attendanceLog.create({
        data: {
          employee_id: employee1Id,
          check_in_at: seventeenHoursAgo,
          status: 'PRESENT',
          source: 'QR_SCAN',
          branch_id: kioskBranchId,
        },
      });

      // New scan should succeed
      const res = await request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${kioskToken}`).send(payload);
      expect(res.status).toBe(200);

      const logs = await p.attendanceLog.findMany({ where: { employee_id: employee1Id }, orderBy: { check_in_at: 'asc' } });
      expect(logs.length).toBe(2);
      expect(logs[0].check_out_at).not.toBeNull();
      expect(logs[0].notes).toBe('SYSTEM_AUTO_CLOSE');
      expect(logs[1].check_out_at).toBeNull();
    });

    it('should allow multi-branch scanning on the same day', async () => {
      const company2Branch = await p.branch.findFirst({ where: { company_id: kioskCompanyId, id: { not: kioskBranchId } } });
      if (!company2Branch) return; // Skip if no second branch

      // Create a kiosk credential for branch 2
      const branch2Cred = await p.kioskCredential.create({
        data: {
          company_id: kioskCompanyId,
          branch_id: company2Branch.id,
          label: 'Branch 2 Kiosk',
          username: `KIOSK-B2-${Date.now()}`,
          password_hash: '$2a$10$xyz', // doesn't matter, we mock token
          is_active: true,
          credential_version: 1,
          created_by_id: employee1Id,
        }
      });

      const jwt = await import('jsonwebtoken');
      const b2Token = jwt.sign({
        type: 'KIOSK', companyId: kioskCompanyId, branchId: company2Branch.id, kioskCredentialId: branch2Cred.id, credentialVersion: 1, createdAt: Date.now()
      }, process.env.JWT_ACCESS_SECRET);

      const payload = { qrPayload: { employeeId: employee1Id, employeeCode: employee1Code, version: 1, signedToken: generateQrHmac(employee1Id, employee1Code, 1) } };

      // Scan in Branch 1
      await request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${kioskToken}`).send(payload);
      // Scan out Branch 1
      await request(app).post('/api/v1/attendance/checkout').set('Authorization', `Bearer ${kioskToken}`).send(payload);
      
      // Scan in Branch 2
      const res = await request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${b2Token}`).send(payload);
      expect(res.status).toBe(200);

      const logs = await p.attendanceLog.findMany({ where: { employee_id: employee1Id }, orderBy: { check_in_at: 'asc' } });
      expect(logs[0].branch_id).toBe(kioskBranchId);
      expect(logs[1].branch_id).toBe(company2Branch.id);
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
      await p.dailyReport.deleteMany({ where: { employee_id: employee1Id } });

      // Submit a daily report for employee 1 so the Phase 5 report_required
      // logout gate does not block the checkout tests.
      const emp1Token = await request(app)
        .post('/api/v1/auth/login')
        .send({ employee_code: employee1Code, password: 'Password@123' })
        .then((r) => r.body.accessToken);

      if (emp1Token) {
        const submitRes = await request(app)
          .post('/api/v1/reports/daily')
          .set('Authorization', `Bearer ${emp1Token}`)
          .send({
            role_name: 'Telecaller',
            metrics: { callsMade: 10, siteVisits: 5, leadsQualified: 2 },
            summary_notes: 'Checkout test daily report',
            target_met: true,
          });
        console.log('[DEBUG beforeEach] submitRes:', submitRes.status, submitRes.body.error || submitRes.body.message);
      } else {
        console.log('[DEBUG beforeEach] emp1Token is null/undefined');
      }
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
      expect(res.body.error).toBe('No active check-in found to check out from. Please check in first.');
    });

    it('should reject checkout if the active check-in is > 16 hours old', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const seventeenHoursAgo = new Date(Date.now() - 17 * 60 * 60 * 1000);
      await p.attendanceLog.create({
        data: {
          employee_id: employee1Id,
          check_in_at: seventeenHoursAgo,
          status: 'PRESENT',
          source: 'QR_SCAN',
          branch_id: kioskBranchId,
        },
      });

      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${kioskToken}`)
        .send({ qrPayload: { employeeId: employee1Id, employeeCode: employee1Code, version: 1, signedToken: qrToken } });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No active check-in found to check out from. Please check in first.');
    });

    it('should correctly handle date-boundary overnight shift and calculate duration', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      
      // Shift started yesterday at 11:30 PM (8 hours ago)
      const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
      await p.attendanceLog.create({
        data: {
          employee_id: employee1Id,
          check_in_at: eightHoursAgo,
          status: 'PRESENT',
          source: 'QR_SCAN',
          branch_id: kioskBranchId,
        },
      });

      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${kioskToken}`)
        .send({ qrPayload: { employeeId: employee1Id, employeeCode: employee1Code, version: 1, signedToken: qrToken } });
      
      expect(res.status).toBe(200);
      expect(res.body.working_duration_minutes).toBeGreaterThanOrEqual(479);
      expect(res.body.working_duration_minutes).toBeLessThanOrEqual(481); // approx 8 hours (480 mins)
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
      // Version was already bumped to 3 by the deactivate/reactivate test
      // (1 -> 2 on deactivate, 2 -> 3 on reactivate), so this rotation
      // should bring it to 4.
      expect(rotateRes.body.credential.credential_version).toBe(4);

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

  describe('Token rejection edge cases', () => {
    it('should reject an expired kiosk token (401)', async () => {
      // Generate an expired token directly with jsonwebtoken (24h in the past)
      const jwt = await import('jsonwebtoken');
      const expiredPayload = {
        type: 'KIOSK',
        companyId: kioskCompanyId,
        branchId: kioskBranchId,
        kioskCredentialId: kioskCredentialId,
        credentialVersion: 1,
        createdAt: Date.now() - 24 * 60 * 60 * 1000, // 24h ago
      };
      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_ACCESS_SECRET);

      const res = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: generateQrHmac(employee1Id, employee1Code, 1),
          },
        });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('Kiosk auth rate-limit / lockout', () => {
    let lockoutCredId: number;
    let lockoutToken: string;

    beforeAll(async () => {
      // Create a separate credential for the lockout tests so we don't
      // pollute the main credential's failure counter.
      const adminToken = await getAdminToken();
      const lockoutRes = await request(app)
        .post('/api/v1/kiosk-credentials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_id: kioskBranchId,
          label: 'Lockout Test Credential',
          username: `KIOSK-LOCKOUT-${uniqueSuffix}`,
          password: 'Lockout@123',
        });
      expect(lockoutRes.status).toBe(201);
      lockoutCredId = lockoutRes.body.credential.id;

      const loginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: `KIOSK-LOCKOUT-${uniqueSuffix}`, password: 'Lockout@123' });
      expect(loginRes.status).toBe(200);
      lockoutToken = loginRes.body.accessToken;
    });

    it('should allow login after fewer than 5 failures (no lockout yet)', async () => {
      // 4 wrong-password attempts on the lockout credential
      for (let i = 0; i < 4; i++) {
        const failRes = await request(app)
          .post('/api/v1/kiosk-auth/login')
          .send({ username: `KIOSK-LOCKOUT-${uniqueSuffix}`, password: 'WrongPassword' });
        expect(failRes.status).toBe(401);
      }
      // The 5th attempt with the correct password should still succeed
      const okRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: `KIOSK-LOCKOUT-${uniqueSuffix}`, password: 'Lockout@123' });
      expect(okRes.status).toBe(200);
    });

    it('should lock out after 5 consecutive failures on the same branch', async () => {
      // 5 wrong-password attempts
      for (let i = 0; i < 5; i++) {
        const failRes = await request(app)
          .post('/api/v1/kiosk-auth/login')
          .send({ username: `KIOSK-LOCKOUT-${uniqueSuffix}`, password: `WrongPass${i}` });
        expect(failRes.status).toBe(401);
      }
      // 6th attempt (even with correct password) should be locked out (403)
      const lockedRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: `KIOSK-LOCKOUT-${uniqueSuffix}`, password: 'Lockout@123' });
      expect(lockedRes.status).toBe(403);
      expect(lockedRes.body.code).toBe('LOCKED_OUT');
    });

    it('should also lock out scan when the branch is rate-limited', async () => {
      // One more failure to be safe, then try a scan — should get 403 LOCKED_OUT
      await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: `KIOSK-LOCKOUT-${uniqueSuffix}`, password: 'AnotherWrong' });

      const scanRes = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${lockoutToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: generateQrHmac(employee1Id, employee1Code, 1),
          },
        });
      expect(scanRes.status).toBe(403);
      expect(scanRes.body.code).toBe('LOCKED_OUT');
    });

    it('should isolate lockout per branch — failures on one branch do not lock out another', async () => {
      // The lockout credential is on kioskBranchId and is already locked out.
      // Create a second credential on a DIFFERENT branch (Tarnaka) and confirm
      // it still works — proving the failure counter is per-branch, not global.
      const tarnakaBranch = await p.branch.findFirst({
        where: { company_id: kioskCompanyId, name: 'Tarnaka Branch' },
      });
      if (!tarnakaBranch) {
        console.warn('Tarnaka Branch not found — skipping per-branch isolation test');
        return;
      }
      const isoRes = await request(app)
        .post('/api/v1/kiosk-credentials')
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({
          branch_id: tarnakaBranch.id,
          label: 'Isolation Test Credential',
          username: `KIOSK-ISO-${uniqueSuffix}`,
          password: 'Iso@123',
        });
      expect(isoRes.status).toBe(201);

      const isoLoginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: `KIOSK-ISO-${uniqueSuffix}`, password: 'Iso@123' });
      expect(isoLoginRes.status).toBe(200);
    });

    afterAll(() => {
      resetKioskAuthState(kioskBranchId);
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
          username: `KIOSK-NEW-${uniqueSuffix}`,
          password: 'Kiosk@789',
        });
      expect(res.status).toBe(201);
      expect(res.body.credential.label).toBe('Front Desk — Test Branch');
      expect(res.body.credential.username).toBe(`KIOSK-NEW-${uniqueSuffix}`);
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

      // Old password should be rejected
      const oldLoginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: `KIOSK-NEW-${uniqueSuffix}`, password: 'Kiosk@789' });
      expect(oldLoginRes.status).toBe(401);

      // New password works
      const newLoginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: `KIOSK-NEW-${uniqueSuffix}`, password: 'NewKiosk@123' });
      expect(newLoginRes.status).toBe(200);
    });

    it('should handle concurrent password changes safely (race condition)', async () => {
      // Get the current version before the race
      const beforeCred = await p.kioskCredential.findUnique({ where: { id: newCredId } });
      const initialVersion = beforeCred.credential_version;

      const adminToken = await getAdminToken();

      // Fire two password change requests concurrently
      const req1 = request(app)
        .patch(`/api/v1/kiosk-credentials/${newCredId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'Concurrent@1' });

      const req2 = request(app)
        .patch(`/api/v1/kiosk-credentials/${newCredId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'Concurrent@2' });

      const [res1, res2] = await Promise.all([req1, req2]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Verify the version bumped by exactly 2 (atomic increment prevents lost updates)
      const afterCred = await p.kioskCredential.findUnique({ where: { id: newCredId } });
      expect(afterCred.credential_version).toBe(initialVersion + 2);
    });

    it('should deactivate and reactivate', async () => {
      const beforeDeact = await p.kioskCredential.findUnique({ where: { id: newCredId } });
      const currentVersion = beforeDeact.credential_version;

      const deactRes = await request(app)
        .patch(`/api/v1/kiosk-credentials/${newCredId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ is_active: false });
      expect(deactRes.status).toBe(200);
      expect(deactRes.body.credential.is_active).toBe(false);
      expect(deactRes.body.credential.credential_version).toBe(currentVersion + 1); // active toggle bumps version

      // Login should fail
      const loginRes = await request(app)
        .post('/api/v1/kiosk-auth/login')
        .send({ username: `KIOSK-NEW-${uniqueSuffix}`, password: 'Concurrent@2' }); // the password is Concurrent@2 due to race test
      expect(loginRes.status).toBe(401);

      // Re-activate
      const reactRes = await request(app)
        .patch(`/api/v1/kiosk-credentials/${newCredId}`)
        .set('Authorization', `Bearer ${await getAdminToken()}`)
        .send({ is_active: true });
      expect(reactRes.status).toBe(200);
      expect(reactRes.body.credential.is_active).toBe(true);
      expect(reactRes.body.credential.credential_version).toBe(currentVersion + 2);
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
          username: `KIOSK-XCOMP-${uniqueSuffix}`,
          password: 'Kiosk@000',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Branch does not belong to your company');
    });
  });
});
