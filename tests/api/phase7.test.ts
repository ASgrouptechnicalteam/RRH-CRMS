import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Roles } from '@rrh-ems/shared';

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 7 - Data Access & Tenant Isolation Hardening', () => {
  let coAToken: string;
  let coBToken: string;
  
  let coA_ID: number;
  let coB_ID: number;

  beforeAll(async () => {
    // 0. Proactive cleanup of any contaminated state from previous failed runs
    await p.employeeRole.deleteMany({ where: { employee: { employee_code: { in: ['RRH-COA-001', 'RRH-COB-001', 'COA-MD-1', 'COB-MD-1'] } } } });
    await p.employee.deleteMany({ where: { employee_code: { in: ['RRH-COA-001', 'RRH-COB-001', 'COA-MD-1', 'COB-MD-1'] } } });
    await p.company.deleteMany({ where: { code: { in: ['COA', 'COB'] } } });

    // 1. Setup Companies
    const coA = await p.company.create({ data: { name: 'Company A', code: 'COA' }});
    const coB = await p.company.create({ data: { name: 'Company B', code: 'COB' }});
    coA_ID = coA.id;
    coB_ID = coB.id;

    // 2. Setup Employees (MDs for full access)
    const mdRole = await p.role.findUnique({ where: { name: Roles.MD } });
    
    const pwdHash = await bcrypt.hash('Password@123', 10);
    
    const empA = await p.employee.create({
      data: {
        employee_code: 'RRH-COA-001',
        full_name: 'MD A',
        email: 'mda@coa.com',
        password_hash: pwdHash,
        company_id: coA.id,
        roles: { create: [{ role_id: mdRole.id }] }
      }
    });

    const empB = await p.employee.create({
      data: {
        employee_code: 'RRH-COB-001',
        full_name: 'MD B',
        email: 'mdb@cob.com',
        password_hash: pwdHash,
        company_id: coB.id,
        roles: { create: [{ role_id: mdRole.id }] }
      }
    });

    const loginA = await request(app).post('/api/v1/auth/login').set('X-Forwarded-For', '127.0.0.1').send({ employee_code: 'RRH-COA-001', password: 'Password@123' });
    console.log('LOGIN A STATUS:', loginA.status, 'BODY:', loginA.body);
    coAToken = loginA.body.accessToken;

    const loginB = await request(app).post('/api/v1/auth/login').set('X-Forwarded-For', '127.0.0.1').send({ employee_code: 'RRH-COB-001', password: 'Password@123' });
    console.log('LOGIN B STATUS:', loginB.status, 'BODY:', loginB.body);
    coBToken = loginB.body.accessToken;

    // 3. Seed test data
    
    // Task for Company A
    await p.task.create({
      data: {
        title: 'Task A',
        target_date: new Date(),
        assignee_id: empA.id,
        created_by: empA.id
      }
    });

    // DailyTarget for Company A
    await p.dailyTarget.create({
      data: {
        role_name: 'Telecaller',
        calls_target: 100,
        company_id: coA.id
      }
    });

    // CP Payout for Company A
    const cpA = await p.channelPartner.create({
      data: {
        cp_code: 'CP-A',
        firm_name: 'CP A',
        contact_name: 'Contact A',
        phone: '1111111111',
        company_id: coA.id
      }
    });
    
    await p.cPPayout.create({
      data: {
        cp_id: cpA.id,
        commission_amount: 5000,
        deal_amount: 100000,
        tier_rate_percent: 5,
        status: 'PENDING',
        payout_code: 'PAYOUT-TEST-1'
      }
    });

    // Attendance Log for Company A
    await p.attendanceLog.create({
      data: {
        employee_id: empA.id,
        status: 'PRESENT',
        source: 'QR_SCAN',
        check_in_at: new Date()
      }
    });

    // Audit Event for Late Proposal (Company A)
    await p.auditEvent.create({
      data: {
        action: 'SUBMIT_LATE_PROPOSAL',
        actor_id: empA.id,
        entity_id: 99938,
        entity_type: 'Attendance'
      }
    });
  });

  afterAll(async () => {
    await p.auditEvent.deleteMany({});
    await p.attendanceLog.deleteMany({});
    await p.cPPayout.deleteMany({});
    await p.channelPartner.deleteMany({});
    await p.dailyTarget.deleteMany({});
    await p.task.deleteMany({});
    await p.employeeRole.deleteMany({ where: { employee: { employee_code: { in: ['RRH-COA-001', 'RRH-COB-001', 'COA-MD-1', 'COB-MD-1'] } } } });
    await p.employee.deleteMany({ where: { employee_code: { in: ['RRH-COA-001', 'RRH-COB-001', 'COA-MD-1', 'COB-MD-1'] } } });
    await p.company.deleteMany({ where: { code: { in: ['COA', 'COB'] } } });
    await prisma.$disconnect();
  });

  describe('A. Tasks Isolation', () => {
    it('prevents Company B MD from seeing Company A tasks via /all-team-tasks', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/all-team-tasks')
        .set('Authorization', `Bearer ${coBToken}`);
      
      if (res.status === 401) console.log('TASK ISOLATION 401 BODY:', res.body);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toBeInstanceOf(Array);
      expect(res.body.tasks).toHaveLength(0); // Co B has no tasks
      
      const resA = await request(app)
        .get('/api/v1/tasks/all-team-tasks')
        .set('Authorization', `Bearer ${coAToken}`);
      expect(resA.body.tasks).toHaveLength(1);
    });
  });

  describe('B. Targets Isolation', () => {
    it('prevents Company B from retrieving Company A global role targets', async () => {
      const res = await request(app)
        .get('/api/v1/targets/all')
        .set('Authorization', `Bearer ${coBToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.targets).toHaveLength(0);
      
      const resA = await request(app)
        .get('/api/v1/targets/all')
        .set('Authorization', `Bearer ${coAToken}`);
      expect(resA.body.targets).toHaveLength(1);
    });
  });

  describe('C. Employees / Managers Isolation', () => {
    it('prevents Company B from seeing Company A MDs in managers list', async () => {
      const res = await request(app)
        .get('/api/v1/employees/managers')
        .set('Authorization', `Bearer ${coBToken}`);
      
      expect(res.status).toBe(200);
      // Only sees MD B, not MD A
      expect(res.body.managers.some((m: any) => m.label && m.label.includes('RRH-COB-001'))).toBe(true);
      expect(res.body.managers.some((m: any) => m.label && m.label.includes('RRH-COA-001'))).toBe(false);
    });
  });

  describe('D. CP Payouts Isolation', () => {
    it('prevents Company B from retrieving Company A payouts', async () => {
      const res = await request(app)
        .get('/api/v1/cp/payouts')
        .set('Authorization', `Bearer ${coBToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.payouts).toHaveLength(0);
      
      const resA = await request(app)
        .get('/api/v1/cp/payouts')
        .set('Authorization', `Bearer ${coAToken}`);
      expect(resA.body.payouts).toHaveLength(1);
    });
  });

  describe('E & F. Attendance Isolation', () => {
    it('prevents Company B from retrieving Company A late proposals', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/proposals/queue')
        .set('Authorization', `Bearer ${coBToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.proposals).toHaveLength(0);
    });

    it('prevents Company B from retrieving Company A live attendance feed', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/live')
        .set('Authorization', `Bearer ${coBToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(0);
      
      const resA = await request(app)
        .get('/api/v1/attendance/live')
        .set('Authorization', `Bearer ${coAToken}`);
      expect(resA.body.logs).toHaveLength(1);
    });
  });
});
