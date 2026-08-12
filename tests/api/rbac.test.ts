import request from 'supertest';
import app from '../../apps/api/src/server';
import { Roles } from '@rrh-ems/shared';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';

const prisma = new PrismaClient();

describe('Phase 1 Stage 2 - Central RBAC & Authorization (P0 Matrix)', () => {
  let mdToken: string;
  let adminToken: string;
  let hrToken: string;
  let telecallerToken: string;
  let targetEmployeeId: number;
  let targetCode: string;

  beforeAll(async () => {
    console.log('[RBAC SETUP] 0 START safety check');
    // 1. Reset test db safely
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }
    console.log('[RBAC SETUP] 0 DONE safety check');
    
    console.log('[RBAC SETUP] 1 START setupDeterministicTestUsers');
    // 2. Setup deterministic users and sync RolePermission matrix
    await setupDeterministicTestUsers();
    console.log('[RBAC SETUP] 1 DONE setupDeterministicTestUsers');

    // 3. Authenticate as authoritative roles
    const getAuth = async (code: string, idx: number) => {
      const res = await request(app).post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.4.${idx}`) // Unique IP range to avoid rate limits
        .send({
          employee_code: code,
          password: 'Password@123',
        });
      return res.body.accessToken;
    };

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;

    console.log('[RBAC SETUP] 2 START Concurrent Logins');
    [mdToken, adminToken, hrToken, telecallerToken] = await Promise.all([
      getAuth(getCode(Roles.MD), 1),
      getAuth(getCode(Roles.ADMIN), 2),
      getAuth(getCode(Roles.HR_MANAGER), 3),
      getAuth(getCode(Roles.TELECALLER), 4)
    ]);
    console.log('[RBAC SETUP] 5 DONE Concurrent Logins');

    console.log('[RBAC SETUP] 6 START Target fetch');
    // 4. Retrieve ID of the target employee to read/update
    targetCode = getCode(Roles.TELECALLER);
    const target = await prisma.employee.findUnique({ where: { employee_code: targetCode } });
    targetEmployeeId = target!.id;
    console.log('[RBAC SETUP] 6 DONE Target fetch');
  });

  describe('Sensitive Employee Fields (employees.view_sensitive)', () => {
    it('T-003: Telecaller cannot access sensitive employee fields', async () => {
      // Telecaller doesn't even have HR/Management privileges to list employees, so it might 403 entirely,
      // but let's check what GET /api/v1/employees returns.
      // Wait, GET /api/v1/employees requires MD, HR, Admin, etc.
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${telecallerToken}`);
      
      expect(res.status).toBe(403);
    });

    it('T-004: HR authorized role can access sensitive employee fields', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`);
      
      expect(res.status).toBe(200);
      const telecaller = res.body.employees.find((e: any) => e.employee_code === targetCode || e.employeeCode === targetCode);
      expect(telecaller).toBeDefined();
      expect(telecaller).toHaveProperty('panNumber'); // should not be undefined/deleted
    });

    it('T-005: ADMIN cannot access sensitive employee fields', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200); // Admin can read employees list
      const telecaller = res.body.employees.find((e: any) => e.employee_code === targetCode || e.employeeCode === targetCode);
      expect(telecaller).toBeDefined();
      expect(telecaller).not.toHaveProperty('panNumber');
      expect(telecaller).not.toHaveProperty('aadhaarNumber');
      expect(telecaller).not.toHaveProperty('bankAccountNumber');
    });

    it('MD can access sensitive employee fields', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${mdToken}`);
      
      expect(res.status).toBe(200);
      const telecaller = res.body.employees.find((e: any) => e.employee_code === targetCode || e.employeeCode === targetCode);
      expect(telecaller).toBeDefined();
      expect(telecaller).toHaveProperty('panNumber');
    });
  });

  describe('Capability Permission Enforcements', () => {
    it('enforces employees.update on PATCH /api/v1/employees/:id for unauthorized user (Telecaller)', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${targetEmployeeId}`)
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({ phone: '+919876543210' });
      
      expect(res.status).toBe(403);
    });

    it('allows employees.update on PATCH /api/v1/employees/:id for authorized user (HR)', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${targetEmployeeId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ current_address: 'New Address' });
      
      // Still 200 OK because HR has employees.update
      expect(res.status).toBe(200);
    });

    it('rejects attempt to modify sensitive fields if user lacks view_sensitive (ADMIN)', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${targetEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ salary_ctc: 5000000 });
      
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Cannot modify sensitive fields/i);
    });
  });

});
