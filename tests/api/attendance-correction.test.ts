import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';

const p = prisma as any;

describe('Attendance Manual Correction', () => {
  let adminToken: string;
  let employeeToken: string;
  let targetEmployeeId: number;
  let adminEmployeeId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();

    // Admin login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: 'RRH-TST-001', password: 'Password@123' });
    adminToken = adminRes.body.accessToken;

    const adminUser = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-001' } });
    adminEmployeeId = adminUser.id;

    // Normal employee login
    const empRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: 'RRH-TST-003', password: 'Password@123' });
    employeeToken = empRes.body.accessToken;

    const empUser = await p.employee.findUnique({ where: { employee_code: 'RRH-TST-003' } });
    targetEmployeeId = empUser.id;
  });

  afterEach(async () => {
    // Clean up attendance logs created during tests
    await p.attendanceLog.deleteMany({
      where: { employee_id: targetEmployeeId }
    });
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/manual-correction')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing required fields');
  });

  it('should reject short reasons', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/manual-correction')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: targetEmployeeId,
        date: '2023-01-01',
        status: 'ABSENT',
        reason: 'short', // less than 10
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10 characters/);
  });

  it('should reject unauthorized roles (normal employee)', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/manual-correction')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employeeId: targetEmployeeId,
        date: '2023-01-01',
        status: 'ABSENT',
        reason: 'Valid reason to be absent',
      });
    expect(res.status).toBe(403);
  });

  it('should reject future dates', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2); // 2 days in future
    const dateStr = futureDate.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/v1/attendance/manual-correction')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: targetEmployeeId,
        date: dateStr,
        status: 'ABSENT',
        reason: 'Valid reason to be absent',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/future dates/i);
  });

  it('should reject overwriting a real KIOSK scan', async () => {
    // 1. Create a fake KIOSK scan for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    await p.attendanceLog.create({
      data: {
        employee_id: targetEmployeeId,
        check_in_at: yesterday,
        status: 'PRESENT',
        source: 'KIOSK',
      }
    });

    // 2. Try to correct it
    const res = await request(app)
      .post('/api/v1/attendance/manual-correction')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: targetEmployeeId,
        date: dateStr,
        status: 'ABSENT',
        reason: 'Valid reason to be absent',
      });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/KIOSK/i);
  });

  it('should successfully create an HR_MANUAL log and record created_by_id', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/v1/attendance/manual-correction')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: targetEmployeeId,
        date: dateStr,
        status: 'LATE',
        reason: 'Employee forgot ID card, marked late by HR',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify DB
    const log = await p.attendanceLog.findUnique({ where: { id: res.body.log.id } });
    expect(log).toBeDefined();
    expect(log.source).toBe('HR_MANUAL');
    expect(log.status).toBe('LATE');
    expect(log.reason).toBe('Employee forgot ID card, marked late by HR');
    expect(log.created_by_id).toBe(adminEmployeeId);
    
    // Convert UTC check_in_at to IST to check if it matches 09:00:00 IST
    expect(log.check_in_at.toISOString()).toContain('T03:30:00.000Z');
  });

  it('should be append-only: multiple corrections produce distinct rows', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const dateStr = twoDaysAgo.toISOString().split('T')[0];

    // First correction
    const res1 = await request(app)
      .post('/api/v1/attendance/manual-correction')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: targetEmployeeId,
        date: dateStr,
        status: 'ABSENT',
        reason: 'Missing in action initially',
      });
    expect(res1.status).toBe(201);

    // Second correction
    const res2 = await request(app)
      .post('/api/v1/attendance/manual-correction')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: targetEmployeeId,
        date: dateStr,
        status: 'LATE',
        reason: 'Actually turned up later, correcting to LATE',
      });
    expect(res2.status).toBe(201);

    // Verify DB has both rows
    const logs = await p.attendanceLog.findMany({ 
      where: { 
        employee_id: targetEmployeeId,
        check_in_at: new Date(`${dateStr}T09:00:00.000+05:30`),
      },
      orderBy: { created_at: 'asc' }
    });

    expect(logs.length).toBe(2);
    expect(logs[0].status).toBe('ABSENT');
    expect(logs[1].status).toBe('LATE');
  });
});
