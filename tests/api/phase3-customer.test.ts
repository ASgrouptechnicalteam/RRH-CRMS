import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { generateAccessToken } from '../../apps/api/src/utils/jwt';
import { Roles, Permissions } from '@rrh-ems/shared';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';


const p = prisma as any;

describe('Phase 3 Customer 360 Foundation', () => {
  let mdTokenCompanyA: string;
  let telecallerTokenCompanyA: string;
  let telecallerTokenCompanyB: string;
  let mdIdCompanyA: number;
  let tcIdCompanyA: number;
  let tcIdCompanyB: number;
  let mdCompanyId: number;
  let tcBCompanyId: number;
  
  let leadCompanyA: any;
  let leadCompanyB: any;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    // Setup MD from Company A
    const mdCode = deterministicUsers.find(u => u.roles.includes(Roles.MD))?.employee_code;
    const mdUser = await p.employee.findUnique({ where: { employee_code: mdCode } });
    if (!mdUser) throw new Error('MD user not found');
    mdIdCompanyA = mdUser.id;
    mdCompanyId = mdUser.company_id;
    mdTokenCompanyA = generateAccessToken({
      employeeId: mdUser.id,
      employeeCode: mdUser.employee_code,
      companyId: mdUser.company_id,
      branchId: null as any,
      tokenVersion: mdUser.token_version,
      roles: [Roles.MD],
      permissions: [Permissions.CUSTOMERS_CREATE, Permissions.CUSTOMERS_READ, Permissions.CUSTOMERS_UPDATE, Permissions.CUSTOMERS_CONVERT],
    });

    // Setup Telecaller from Company A
    const tcACode = deterministicUsers.find(u => u.roles.includes(Roles.TELECALLER))!.employee_code;
    const tcAUser = await p.employee.findUnique({ where: { employee_code: tcACode } });
    if (!tcAUser) throw new Error('TC A user not found');
    tcIdCompanyA = tcAUser.id;
    telecallerTokenCompanyA = generateAccessToken({
      employeeId: tcAUser.id,
      employeeCode: tcAUser.employee_code,
      companyId: tcAUser.company_id,
      branchId: null as any,
      tokenVersion: tcAUser.token_version,
      roles: [Roles.TELECALLER],
      permissions: [
        Permissions.CUSTOMERS_READ,
        Permissions.CUSTOMERS_UPDATE,
        Permissions.CUSTOMERS_CONVERT,
      ],
    });

    // Setup Telecaller from Company B
    const tcBCode = crossOrgUsers[0].employee_code;
    const tcBUser = await p.employee.findUnique({ where: { employee_code: tcBCode } });
    if (!tcBUser) throw new Error('TC B user not found');
    tcIdCompanyB = tcBUser.id;
    tcBCompanyId = tcBUser.company_id;
    telecallerTokenCompanyB = generateAccessToken({
      employeeId: tcBUser.id,
      employeeCode: tcBUser.employee_code,
      companyId: tcBUser.company_id,
      branchId: null as any,
      tokenVersion: tcBUser.token_version,
      roles: [Roles.TELECALLER],
      permissions: [
        Permissions.CUSTOMERS_READ,
        Permissions.CUSTOMERS_UPDATE,
        Permissions.CUSTOMERS_CONVERT,
      ],
    });

    // Clean existing test data
    await p.leadActivity.deleteMany({ where: { lead: { lead_code: { in: ['RRH-P3-LEAD-A', 'RRH-P3-LEAD-B'] } } } });
    await p.customer.deleteMany({ where: { origin_lead: { lead_code: { in: ['RRH-P3-LEAD-A', 'RRH-P3-LEAD-B'] } } } });
    await p.customer.deleteMany({ where: { phone: { in: ['+919999900001', '+919999900002', '+919999900003'] } } });
    await p.customer.deleteMany({ where: { customer_code: { in: ['RRH-P3-CUST-1', 'RRH-P3-CUST-2', 'RRH-P3-CUST-MD'] } } });
    await p.lead.deleteMany({ where: { lead_code: { in: ['RRH-P3-LEAD-A', 'RRH-P3-LEAD-B'] } } });

    // Create Leads
    leadCompanyA = await p.lead.create({
      data: {
        lead_code: 'RRH-P3-LEAD-A',
        company_id: mdCompanyId,
        customer_name: 'Phase3 Test Lead A',
        phone: '+919876543210',
        status: 'NEW',
        source: 'MANUAL_ENTRY',
        assigned_to_id: tcIdCompanyA,
        created_by_id: tcIdCompanyA,
      },
    });

    leadCompanyB = await p.lead.create({
      data: {
        lead_code: 'RRH-P3-LEAD-B',
        company_id: tcBCompanyId,
        customer_name: 'Phase3 Test Lead B',
        phone: '+919876543211',
        status: 'NEW',
        source: 'MANUAL_ENTRY',
        assigned_to_id: tcIdCompanyB,
        created_by_id: tcIdCompanyB,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Customer API Operations', () => {
    let createdCustomerId: number;

    it('TEST 1 - Authorized creation: MD can create a customer directly', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${mdTokenCompanyA}`)
        .send({
          first_name: 'Direct',
          last_name: 'Customer',
          phone: '+919999900001',
          source: 'DIRECT',
          assigned_to_id: tcIdCompanyA,
        });

      if (res.status !== 201) {
        console.log('TEST 1 FAILED. res.body:', res.body);
      }
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      createdCustomerId = res.body.id;
    });

    it('TEST 2 - Unauthorized creation: Agent/Telecaller lacking create permission cannot create directly', async () => {
      // Telecaller has CUSTOMERS_CONVERT, but not CUSTOMERS_CREATE
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${telecallerTokenCompanyA}`)
        .send({
          first_name: 'Hacked',
          phone: '+919999900002',
        });

      expect(res.status).toBe(403);
    });

    it('TEST 3 - Tenant isolation: Company B cannot read Company A Customer', async () => {
      const res = await request(app)
        .get(`/api/v1/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${telecallerTokenCompanyB}`);

      expect(res.status).toBe(404); // Not found or access denied
    });

    it('TEST 4 - Tenant update isolation: Company B cannot update Company A Customer', async () => {
      const res = await request(app)
        .patch(`/api/v1/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${telecallerTokenCompanyB}`)
        .send({ first_name: 'Hacked' });

      expect(res.status).toBe(404);
    });

    it('TEST 5 - Ownership enforcement: Agent A cannot update Customer not assigned to them', async () => {
      // Create a customer assigned to MD
      const custCode = 'RRH-P3-CUST-MD-' + Date.now();
      const cust = await p.customer.create({
        data: {
          customer_code: custCode,
          company_id: mdCompanyId,
          first_name: 'MD Customer',
          phone: '+919999900003',
          assigned_to_id: mdIdCompanyA,
        }
      });

      const res = await request(app)
        .patch(`/api/v1/customers/${cust.id}`)
        .set('Authorization', `Bearer ${telecallerTokenCompanyA}`)
        .send({ first_name: 'Hacked by TC' });

      expect(res.status).toBe(404);
    });

    it('TEST 6 - Authorized ownership update: Assigned Agent can update their Customer', async () => {
      const res = await request(app)
        .patch(`/api/v1/customers/${createdCustomerId}`) // Assigned to tcIdCompanyA
        .set('Authorization', `Bearer ${telecallerTokenCompanyA}`)
        .send({ first_name: 'Updated By Owner' });

      expect(res.status).toBe(200);
      expect(res.body.first_name).toBe('Updated By Owner');
    });
  });

  describe('Lead to Customer Conversion', () => {
    it('TEST 7 - Lead conversion: Authorized user converts Lead', async () => {
      const res = await request(app)
        .post(`/api/v1/leads/${leadCompanyA.id}/convert-to-customer`)
        .set('Authorization', `Bearer ${telecallerTokenCompanyA}`); // TC has CONVERT permission

      expect(res.status).toBe(201);
      expect(res.body.customer.origin_lead_id).toBe(leadCompanyA.id);

      // Verify Lead still exists
      const lead = await p.lead.findUnique({ where: { id: leadCompanyA.id } });
      expect(lead).toBeDefined();
      expect(lead.status).toBe('BOOKED');

      // Verify LeadActivity
      const activity = await p.leadActivity.findFirst({
        where: { lead_id: leadCompanyA.id, activity_type: 'LEAD_CONVERTED_TO_CUSTOMER' }
      });
      expect(activity).toBeDefined();
    });

    it('TEST 8 - Duplicate conversion: Convert the same Lead twice fails', async () => {
      const res = await request(app)
        .post(`/api/v1/leads/${leadCompanyA.id}/convert-to-customer`)
        .set('Authorization', `Bearer ${telecallerTokenCompanyA}`);

      expect(res.status).toBe(409); // Conflict
    });

    it('TEST 9 - Cross-tenant conversion: Company B user attempts to convert Company A Lead', async () => {
      const res = await request(app)
        .post(`/api/v1/leads/${leadCompanyA.id}/convert-to-customer`)
        .set('Authorization', `Bearer ${telecallerTokenCompanyB}`);

      // Company B cannot even find Company A lead
      expect(res.status).toBe(404);
    });

    it('TEST 10 - Sensitive tenant boundary: List query only returns Company B customers for Company B user', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${telecallerTokenCompanyB}`);

      expect(res.status).toBe(200);
      expect(res.body.customers).toBeInstanceOf(Array);
      
      // Ensure no company A customers are in the list
      const companyACust = res.body.customers.find((c: any) => c.company_id === mdCompanyId);
      expect(companyACust).toBeUndefined();
    });
  });
});
