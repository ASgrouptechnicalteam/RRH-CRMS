import { Roles } from '@rrh-ems/shared';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

const p = prisma as any;

// findBestAssigneeForLead (utils/distributionService.ts) already existed and
// was already used by bulk-upload and lead-recovery, but was never actually
// called for (a) a freshly-created POOL lead via the normal createLead()
// path, or (b) a public-website lead. Both public.ts's POST /:brand/leads
// and lead/create.ts's POOL branch now wire it up. This suite covers both.
describe('Lead auto-distribution wiring', () => {
  let companyId: number;
  let mdToken: string;
  let apiKey: string;
  const cleanupLeadNames: string[] = [];

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getCode = (role: string) =>
      deterministicUsers.find((u) => u.roles[0] === role)!.employee_code;
    const md = (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } }))!;
    companyId = md.company_id;

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: getCode(Roles.MD), password: 'Password@123' });
    mdToken = loginRes.body.accessToken;

    const testApiKey = `LEAD-DIST-TEST-${Date.now()}`;
    await p.publicApiKey.create({
      data: { api_key: testApiKey, company_id: companyId, is_active: true },
    });
    apiKey = testApiKey;
  });

  afterAll(async () => {
    await p.lead.deleteMany({ where: { customer_name: { in: cleanupLeadNames } } });
    await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
    await prisma.$disconnect();
  });

  it('1. An internally-created POOL lead is auto-assigned to a telecaller immediately, not left for manual pickup', async () => {
    const name = `Dist Internal ${Date.now()}`;
    cleanupLeadNames.push(name);

    const res = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        customer_name: name,
        phone: `9${String(Date.now()).slice(-9)}`,
        source: 'MANUAL_ENTRY',
      });

    expect(res.status).toBe(201);
    const lead = await p.lead.findUnique({ where: { id: res.body.lead.id } });
    expect(lead.status).toBe('ASSIGNED');
    // Don't assert a specific employee id — this shared test_db can carry
    // more than one ACTIVE telecaller for company 1 across suites, and
    // findBestAssigneeForLead is correctly picking whichever currently
    // scores highest. What matters is that *some* real telecaller in this
    // company got it, immediately, not that it's left in the pool.
    const assignee = await p.employee.findFirst({
      where: {
        id: lead.assigned_to_id,
        company_id: companyId,
        roles: { some: { role: { name: Roles.TELECALLER } } },
      },
    });
    expect(assignee).not.toBeNull();
    expect(lead.assignment_type).toBe('PERFORMANCE_WEIGHTED');
    expect(lead.ownership_type).toBe('POOL');
  });

  it('2. A public-website lead is duplicate-checked, scored, and auto-assigned — not a bare insert', async () => {
    const name = `Dist Website ${Date.now()}`;
    cleanupLeadNames.push(name);
    const phone = `9${String(Date.now()).slice(-9)}`;

    const res = await request(app)
      .post('/api/v1/public/rrh/leads')
      .set('x-api-key', apiKey)
      .send({
        customer_name: name,
        phone,
        property_type_preference: 'APARTMENT',
        budget_max: 5000000,
      });

    expect(res.status).toBe(201);
    const lead = await p.lead.findUnique({ where: { id: res.body.leadId } });
    expect(lead.source).toBe('WEBSITE');
    expect(lead.status).toBe('ASSIGNED');
    const assignee = await p.employee.findFirst({
      where: {
        id: lead.assigned_to_id,
        company_id: companyId,
        roles: { some: { role: { name: Roles.TELECALLER } } },
      },
    });
    expect(assignee).not.toBeNull();
    expect(lead.assignment_type).toBe('PERFORMANCE_WEIGHTED');
    // Attribution must stay null — a website visitor is not an employee creator.
    expect(lead.created_by_id).toBeNull();
    expect(lead.lead_score).toBeGreaterThan(0);
    expect(lead.sla_breach_at).not.toBeNull();
  });

  it('3. A re-inquiry from the same website visitor does not create a duplicate lead', async () => {
    const name = `Dist Website Dup ${Date.now()}`;
    cleanupLeadNames.push(name);
    const phone = `9${String(Date.now()).slice(-9)}`;

    const first = await request(app)
      .post('/api/v1/public/rrh/leads')
      .set('x-api-key', apiKey)
      .send({ customer_name: name, phone });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/public/rrh/leads')
      .set('x-api-key', apiKey)
      .send({ customer_name: `${name} again`, phone });
    expect(second.status).toBe(201);
    expect(second.body.leadId).toBe(first.body.leadId);

    const allLeadsForPhone = await p.lead.count({ where: { phone, company_id: companyId } });
    expect(allLeadsForPhone).toBe(1);
  });

  it('4. The system-actor employee used for website leads cannot authenticate', async () => {
    const systemEmp = await p.employee.findFirst({
      where: { company_id: companyId, employee_code: { startsWith: 'SYSTEM-DEFAULT-' } },
    });
    expect(systemEmp).toBeDefined();
    expect(systemEmp.password_hash).toBe('');

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: systemEmp.employee_code, password: 'anything' });
    // 400 (employee_code fails the RRH-XX-000 format regex) or 401
    // (password check fails) both prove the same thing: it cannot log in.
    expect([400, 401]).toContain(res.status);
  });
});
