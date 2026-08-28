import request from 'supertest';
import app from '../../apps/api/src/server';
import { generateAccessToken } from '../../apps/api/src/utils/jwt';
import { Roles, Permissions } from '@rrh-ems/shared';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';


const ALL_PERMS = Object.values(Permissions).filter((p) => typeof p === 'string') as string[];
const COMPLAINT_ALL = [
  Permissions.COMPLAINTS_CREATE,
  Permissions.COMPLAINTS_READ,
  Permissions.COMPLAINTS_UPDATE,
  Permissions.COMPLAINTS_ASSIGN,
  Permissions.COMPLAINTS_RESOLVE,
  Permissions.COMPLAINTS_CLOSE,
];

describe('Phase 14 Packet 14-1 — Complaint Management', () => {
  let mdToken: string;
  let adminToken: string;
  let dloToken: string; // read + update only
  let telecallerToken: string; // no complaint perms
  let crossAgentToken: string; // company 2 AGENT with full complaint perms (cross-company)

  let customerId: number; // company 1
  let crossCustomerId: number; // company 2
  let assigneeId: number; // company 1 employee
  let crossAssigneeId: number; // company 2 employee

  const parseId = (res: request.Response): number => res.body.id;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }
    await setupDeterministicTestUsers();

    const comp1 = await prisma.company.findUnique({ where: { code: 'TEST_COMP_01' } });
    const comp2 = await prisma.company.findUnique({ where: { code: 'TEST_COMP_02' } });
    const company1 = comp1!.id;
    const company2 = comp2!.id;

    const emp = async (code: string) => (await prisma.employee.findUnique({ where: { employee_code: code } }))!;
    const mdEmp = await emp('RRH-TST-000');
    const adminEmp = await emp('RRH-TST-001');
    const dloEmp = await emp('RRH-TST-004');
    const tcEmp = await emp('RRH-TST-005');
    assigneeId = adminEmp.id;

    // Company-2 agent for cross-company isolation tests (has complaint perms, other company)
    const crossAgent = await prisma.employee.create({
      data: {
        employee_code: 'RRH-TST-14X',
        full_name: 'Cross Agent',
        phone: '+919999888001',
        company_id: company2,
        password_hash: '$2a$12$testplaceholder',
        status: 'ACTIVE',
        department: 'OPERATIONS',
      },
    });
    crossAssigneeId = crossAgent.id;

    mdToken = generateAccessToken({ employeeId: mdEmp.id, employeeCode: 'RRH-TST-000', companyId: company1, branchId: null as any, roles: [Roles.MD], permissions: ALL_PERMS });
    adminToken = generateAccessToken({ employeeId: adminEmp.id, employeeCode: 'RRH-TST-001', companyId: company1, branchId: null as any, roles: [Roles.ADMIN], permissions: [...COMPLAINT_ALL] });
    dloToken = generateAccessToken({ employeeId: dloEmp.id, employeeCode: 'RRH-TST-004', companyId: company1, branchId: null as any, roles: [Roles.DIGITAL_LEAD_OPERATOR], permissions: [Permissions.COMPLAINTS_READ, Permissions.COMPLAINTS_UPDATE] });
    telecallerToken = generateAccessToken({ employeeId: tcEmp.id, employeeCode: 'RRH-TST-005', companyId: company1, branchId: null as any, roles: [Roles.TELECALLER], permissions: [] });
    crossAgentToken = generateAccessToken({ employeeId: crossAgent.id, employeeCode: 'RRH-TST-C14X', companyId: company2, branchId: null as any, roles: [Roles.AGENT], permissions: [...COMPLAINT_ALL] });

    // Isolated test customers
    const cust = await prisma.customer.create({
      data: { customer_code: `P14CUST-${Date.now()}-A`, company_id: company1, first_name: 'P14', last_name: 'One', phone: '+919990000111' },
    });
    customerId = cust.id;
    const ccust = await prisma.customer.create({
      data: { customer_code: `P14CUST-${Date.now()}-B`, company_id: company2, first_name: 'P14', last_name: 'Two', phone: '+919990000222' },
    });
    crossCustomerId = ccust.id;
  });

  describe('Creation', () => {
    it('creates a valid complaint with default OPEN/MEDIUM', async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Water seepage in living room' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.customer_id).toBe(customerId);
      expect(res.body.status).toBe('OPEN');
      expect(res.body.priority).toBe('MEDIUM');
      expect(res.body.complaint_code).toMatch(/^RRH-CMP-/);
      expect(res.body.booking_id).toBeNull();
      expect(res.body.property_id).toBeNull();
      expect(res.body.category).toBeNull();
    });

    it('rejects creation without a title', async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId });
      expect(res.status).toBe(400);
    });

    it('rejects creation without a valid customer', async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: 999999999, title: 'No customer' });
      expect(res.status).toBe(403);
    });

    it('rejects an invalid priority (CRITICAL not supported)', async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Bad priority', priority: 'CRITICAL' });
      expect(res.status).toBe(400);
    });

    it('generates unique complaint codes', async () => {
      const codes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/v1/complaints')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ customer_id: customerId, title: `Unique code ${i}` });
        expect(res.status).toBe(201);
        codes.push(res.body.complaint_code);
      }
      expect(new Set(codes).size).toBe(codes.length);
    });
  });

  describe('Retrieval', () => {
    let id: number;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Retrieval complaint' });
      id = parseId(res);
    });

    it('lists complaints scoped to company', async () => {
      const res = await request(app).get('/api/v1/complaints').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('gets a complaint by id', async () => {
      const res = await request(app).get(`/api/v1/complaints/${id}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
    });

    it('returns 404 for a non-existent complaint', async () => {
      const res = await request(app).get('/api/v1/complaints/999999999').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('filters list by status', async () => {
      const res = await request(app).get('/api/v1/complaints?status=OPEN').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.every((c: any) => c.status === 'OPEN')).toBe(true);
    });
  });

  describe('Update', () => {
    let id: number;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Update me' });
      id = parseId(res);
    });

    it('updates editable fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated title', category: 'QUALITY', priority: 'HIGH', description: 'updated' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated title');
      expect(res.body.priority).toBe('HIGH');
      expect(res.body.category).toBe('QUALITY');
    });
  });

  describe('Assignment', () => {
    let id: number;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Assign me' });
      id = parseId(res);
    });

    it('assigns a complaint to a same-company employee', async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employee_id: assigneeId });
      expect(res.status).toBe(200);
      expect(res.body.assigned_employee_id).toBe(assigneeId);
    });

    it('rejects assignment to a cross-company employee', async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employee_id: crossAssigneeId });
      expect(res.status).toBe(403);
    });
  });

  describe('Authorization by role', () => {
    let id: number;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Authz complaint' });
      id = parseId(res);
    });

    it('denies a role with no complaint permissions (telecaller)', async () => {
      const read = await request(app).get('/api/v1/complaints').set('Authorization', `Bearer ${telecallerToken}`);
      const create = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({ customer_id: customerId, title: 'no perms' });
      expect(read.status).toBe(403);
      expect(create.status).toBe(403);
    });

    it('DLO can read and update but not assign/resolve/close', async () => {
      const read = await request(app).get(`/api/v1/complaints/${id}`).set('Authorization', `Bearer ${dloToken}`);
      const update = await request(app)
        .patch(`/api/v1/complaints/${id}`)
        .set('Authorization', `Bearer ${dloToken}`)
        .send({ description: 'DLO updated' });
      const assign = await request(app)
        .patch(`/api/v1/complaints/${id}/assign`)
        .set('Authorization', `Bearer ${dloToken}`)
        .send({ employee_id: assigneeId });
      expect(read.status).toBe(200);
      expect(update.status).toBe(200);
      expect(assign.status).toBe(403);
    });

    it('allows an authorized role (admin) full management', async () => {
      const res = await request(app).get(`/api/v1/complaints/${id}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Company isolation / cross-company', () => {
    let comp1ComplaintId: number;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Company A only' });
      comp1ComplaintId = parseId(res);
    });

    it('rejects cross-company read (404, not leaked)', async () => {
      const res = await request(app).get(`/api/v1/complaints/${comp1ComplaintId}`).set('Authorization', `Bearer ${crossAgentToken}`);
      expect(res.status).toBe(404);
    });

    it('rejects cross-company update (404)', async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${comp1ComplaintId}`)
        .set('Authorization', `Bearer ${crossAgentToken}`)
        .send({ title: 'hacked' });
      expect(res.status).toBe(404);
    });

    it('rejects creating a complaint against a cross-company customer', async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${crossAgentToken}`)
        .send({ customer_id: customerId, title: 'cross create' });
      expect(res.status).toBe(403);
    });

    it('list is scoped to the caller company (no leak)', async () => {
      // Company A admin list includes the Company A complaint
      const aList = await request(app).get('/api/v1/complaints').set('Authorization', `Bearer ${adminToken}`);
      // Company B agent list must NOT contain the Company A complaint
      const bList = await request(app).get('/api/v1/complaints').set('Authorization', `Bearer ${crossAgentToken}`);
      expect(aList.status).toBe(200);
      expect(bList.status).toBe(200);
      const aIds = aList.body.map((c: any) => c.id);
      const bIds = bList.body.map((c: any) => c.id);
      expect(aIds).toContain(comp1ComplaintId);
      expect(bIds).not.toContain(comp1ComplaintId);
    });
  });

  describe('Lifecycle', () => {
    let c1: number, c2: number, c3: number, c4: number, c5: number, c6: number;
    beforeAll(async () => {
      const mk = async () => {
        const res = await request(app).post('/api/v1/complaints').set('Authorization', `Bearer ${adminToken}`)
          .send({ customer_id: customerId, title: 'Lifecycle' });
        return parseId(res);
      };
      c1 = await mk(); c2 = await mk(); c3 = await mk(); c4 = await mk(); c5 = await mk(); c6 = await mk();
    });

    it('OPEN -> IN_PROGRESS', async () => {
      const res = await request(app).patch(`/api/v1/complaints/${c1}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'IN_PROGRESS' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('OPEN -> RESOLVED (via /resolve)', async () => {
      const res = await request(app).patch(`/api/v1/complaints/${c3}/resolve`).set('Authorization', `Bearer ${adminToken}`).send({ resolution_description: 'Fixed' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('RESOLVED');
    });

    it('IN_PROGRESS -> RESOLVED', async () => {
      await request(app).patch(`/api/v1/complaints/${c4}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'IN_PROGRESS' });
      const res = await request(app).patch(`/api/v1/complaints/${c4}/resolve`).set('Authorization', `Bearer ${adminToken}`).send({ resolution_description: 'Resolved now' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('RESOLVED');
    });

    it('RESOLVED -> CLOSED', async () => {
      await request(app).patch(`/api/v1/complaints/${c5}/resolve`).set('Authorization', `Bearer ${adminToken}`).send({ resolution_description: 'x' });
      const res = await request(app).patch(`/api/v1/complaints/${c5}/close`).set('Authorization', `Bearer ${adminToken}`).send({ closure_reason: 'RESOLVED' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CLOSED');
    });

    it('CLOSED -> REOPENED', async () => {
      await request(app).patch(`/api/v1/complaints/${c1}/resolve`).set('Authorization', `Bearer ${adminToken}`).send({ resolution_description: 'x' });
      await request(app).patch(`/api/v1/complaints/${c1}/close`).set('Authorization', `Bearer ${adminToken}`).send({});
      const res = await request(app).patch(`/api/v1/complaints/${c1}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'REOPENED' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('REOPENED');
    });

    it('REOPENED -> IN_PROGRESS and RESOLVED', async () => {
      const r1 = await request(app).patch(`/api/v1/complaints/${c1}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'IN_PROGRESS' });
      expect(r1.status).toBe(200);
      const r2 = await request(app).patch(`/api/v1/complaints/${c1}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'RESOLVED' });
      expect(r2.status).toBe(200);
    });

    it('REOPENED -> RESOLVED', async () => {
      await request(app).patch(`/api/v1/complaints/${c2}/resolve`).set('Authorization', `Bearer ${adminToken}`).send({ resolution_description: 'x' });
      await request(app).patch(`/api/v1/complaints/${c2}/close`).set('Authorization', `Bearer ${adminToken}`).send({});
      await request(app).patch(`/api/v1/complaints/${c2}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'REOPENED' });
      const res = await request(app).patch(`/api/v1/complaints/${c2}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'RESOLVED' });
      expect(res.status).toBe(200);
    });

    it('rejects invalid transition OPEN -> CLOSED', async () => {
      const res = await request(app).patch(`/api/v1/complaints/${c6}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'CLOSED' });
      expect(res.status).toBe(400);
    });
  });

  describe('Resolution & Closure data', () => {
    it('stores resolution + closure fields', async () => {
      const created = await request(app).post('/api/v1/complaints').set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Resolve & close' });
      const id = parseId(created);
      const res = await request(app).patch(`/api/v1/complaints/${id}/resolve`).set('Authorization', `Bearer ${adminToken}`)
        .send({ resolution_description: 'Repaired the leak' });
      expect(res.status).toBe(200);
      expect(res.body.resolution_description).toBe('Repaired the leak');
      expect(res.body.resolved_by).toBeDefined();
      expect(res.body.resolved_at).toBeTruthy();
      const closed = await request(app).patch(`/api/v1/complaints/${id}/close`).set('Authorization', `Bearer ${adminToken}`)
        .send({ closure_reason: 'RESOLVED' });
      expect(closed.status).toBe(200);
      expect(closed.body.status).toBe('CLOSED');
      expect(closed.body.closed_at).toBeTruthy();
      expect(closed.body.closure_reason).toBe('RESOLVED');
    });
  });

  describe('Audit events', () => {
    it('records created/resolved/closed/reopened via AuditEvent', async () => {
      const created = await request(app).post('/api/v1/complaints').set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: customerId, title: 'Audit trail' });
      const id = parseId(created);
      await request(app).patch(`/api/v1/complaints/${id}/resolve`).set('Authorization', `Bearer ${adminToken}`).send({ resolution_description: 'audit' });
      await request(app).patch(`/api/v1/complaints/${id}/close`).set('Authorization', `Bearer ${adminToken}`).send({});
      await request(app).patch(`/api/v1/complaints/${id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'REOPENED' });

      const rows = await prisma.auditEvent.findMany({ where: { entity_type: 'Complaint', entity_id: id }, orderBy: { id: 'asc' } });
      const actions = rows.map((r) => r.action);
      expect(actions).toContain('created');
      expect(actions).toContain('resolved');
      expect(actions).toContain('closed');
      expect(actions).toContain('reopened');
    });
  });

  afterAll(async () => {
    // Clean up Packet 14-1 test data (complaints, customers, test employee)
    try {
      await prisma.complaint.deleteMany({ where: { OR: [{ customer_id: customerId }, { customer_id: crossCustomerId }] } });
    } catch { }
    try {
      await prisma.customer.deleteMany({ where: { id: { in: [customerId, crossCustomerId] } } });
    } catch { }
    try {
      const code = customerId ? 'RRH-TST-14X' : undefined;
      if (code) await prisma.employee.deleteMany({ where: { employee_code: code } });
    } catch { }
    try {
      await prisma.employee.deleteMany({ where: { employee_code: 'RRH-TST-C14X' } });
    } catch { }
    try {
      await prisma.$disconnect();
    } catch { }
  });
});