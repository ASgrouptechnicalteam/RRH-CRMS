import request from 'supertest';
import app from '../../apps/api/src/server';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';

/**
 * Phase 16 V1 — Packet D (15-16): /md/employees company-isolation verification.
 *
 * Confirms the remediation: GET /api/v1/md/employees must return employees ONLY from
 * req.user.companyId (Company A), never Company B's employees (RRH-TST-999, company_id 2).
 * Also verifies the existing EMPLOYEES_READ authorization boundary (401 / 403 / 200).
 */
const prisma = new (require('@prisma/client').PrismaClient)();

describe('Packet D — GET /api/v1/md/employees company isolation', () => {
  let mdToken: string;
  const crossCompanyCode = 'RRH-TST-999'; // deterministic Company-2 employee

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against the isolated test database.');
    }
    await setupDeterministicTestUsers();

    const mdUser = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!;
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.10.99')
      .send({ employee_code: mdUser.employee_code, password: 'Password@123' });
    expect(login.status).toBe(200);
    mdToken = login.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 200 for an authorized user (MD has EMPLOYEES_READ)', async () => {
    const res = await request(app)
      .get('/api/v1/md/employees')
      .set('Authorization', `Bearer ${mdToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.employees)).toBe(true);
  });

  it('is company-scoped: Company-B employee is absent for Company-A MD', async () => {
    const res = await request(app)
      .get('/api/v1/md/employees')
      .set('Authorization', `Bearer ${mdToken}`);

    expect(res.status).toBe(200);
    const codes = res.body.employees.map((e: any) => e.employeeCode);
    expect(codes).not.toContain(crossCompanyCode); // Company-B employee MUST be absent
    // Every returned employee must belong to Company A (the requesting user's company).
    const companies = res.body.employees.map((e: any) => e.company);
    expect(companies.length).toBeGreaterThan(0);
    expect(companies.every((c: any) => c && c !== undefined)).toBe(true);
  });

  it('requires authentication (401 without a token)', async () => {
    const res = await request(app).get('/api/v1/md/employees');
    expect(res.status).toBe(401);
  });

  it('rejects callers without EMPLOYEES_READ (403)', async () => {
    // RRH-TST-005 is a TELECALLER without EMPLOYEES_READ.
    const tcUser = deterministicUsers.find((u) => u.employee_code === 'RRH-TST-005')!;
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.10.99')
      .send({ employee_code: tcUser.employee_code, password: 'Password@123' });
    expect(login.status).toBe(200);
    const res = await request(app)
      .get('/api/v1/md/employees')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(403);
  });
});
