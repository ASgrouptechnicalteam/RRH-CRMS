import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { generateQrHmac } from '../../apps/api/src/utils/qr';
import { getISTComponents } from '../../apps/api/src/utils/time';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';


const p = prisma as any;

describe('Attendance Kiosk End-to-End (Backend)', () => {
  let adminToken: string;
  let employee1Id: number;
  let employee1Code: string;
  let company1Id: number;
  
  let company2AdminToken: string;
  let employee2Id: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();

    // 1. Get an Admin token for Company 1
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: 'RRH-TST-001', password: 'Password@123' });
    adminToken = loginRes.body.accessToken;

    const adminUser = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-001' } });
    company1Id = adminUser.company_id;

    // 2. Get Employee 1 (same company as Admin)
    const emp1 = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-003' } });
    employee1Id = emp1.id;
    employee1Code = emp1.employee_code;

    // 3. Get Employee 2 (Company 2)
    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: 'RRH-TST-999', password: 'Password@123' });
    company2AdminToken = loginRes2.body.accessToken;

    const emp2 = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-999' } });
    employee2Id = emp2.id;
  });

  afterAll(async () => {
    await p.attendanceLog.deleteMany({
      where: { employee_id: { in: [employee1Id, employee2Id] } },
    });
    await prisma.$disconnect();
  });

  describe('Check-in via POST /scan', () => {
    beforeEach(async () => {
      await p.attendanceLog.deleteMany({ where: { employee_id: employee1Id } });
    });

    it('should reject a QR code from a different company (Tenant Isolation)', async () => {
      const qrToken = generateQrHmac(employee2Id, 'RRH-TST-999', 1);
      
      const res = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${adminToken}`) // Admin from Company 1 scanning Emp from Company 2
        .send({
          qrPayload: {
            employeeId: employee2Id,
            employeeCode: 'RRH-TST-999',
            version: 1,
            signedToken: qrToken
          }
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Employee does not belong to your company');
    });

    it('should successfully check in an employee from the same company', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      
      const res = await request(app)
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.alreadyStamped).toBe(false);

      // Verify the log was created for EMPLOYEE 1, not the ADMIN
      const logs = await p.attendanceLog.findMany({ where: { employee_id: employee1Id } });
      expect(logs.length).toBe(1);
      expect(logs[0].check_out_at).toBeNull();
    });

    it('should prevent concurrent duplicate check-ins (Race condition protection)', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const payload = {
        qrPayload: {
          employeeId: employee1Id,
          employeeCode: employee1Code,
          version: 1,
          signedToken: qrToken
        }
      };

      const req1 = request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${adminToken}`).send(payload);
      const req2 = request(app).post('/api/v1/attendance/scan').set('Authorization', `Bearer ${adminToken}`).send(payload);

      const [res1, res2] = await Promise.all([req1, req2]);
      
      const successCount = [res1.status, res2.status].filter(s => s === 200).length;
      expect(successCount).toBe(2); // One is check-in, one is "Already checked in"

      const logs = await p.attendanceLog.findMany({ where: { employee_id: employee1Id } });
      expect(logs.length).toBe(1); // Only 1 physical record inserted!
    });
  });

  describe('Check-out via POST /checkout', () => {
    beforeEach(async () => {
      await p.attendanceLog.deleteMany({ where: { employee_id: employee1Id } });
    });

    it('should reject checkout if no active check-in exists', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No active check-in found for today');
    });

    it('should successfully checkout and calculate duration', async () => {
      const qrToken = generateQrHmac(employee1Id, employee1Code, 1);
      
      // Manually create a check-in from 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await p.attendanceLog.create({
        data: {
          employee_id: employee1Id,
          check_in_at: twoHoursAgo,
          status: 'PRESENT',
          source: 'QR_SCAN',
        }
      });

      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qrPayload: {
            employeeId: employee1Id,
            employeeCode: employee1Code,
            version: 1,
            signedToken: qrToken
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.working_duration_minutes).toBeGreaterThanOrEqual(119);
      expect(res.body.working_duration_minutes).toBeLessThanOrEqual(121);

      const logs = await p.attendanceLog.findMany({ where: { employee_id: employee1Id } });
      expect(logs[0].check_out_at).not.toBeNull();
      expect(logs[0].working_duration_minutes).toBe(res.body.working_duration_minutes);
    });
  });
});
