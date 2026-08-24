import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { generateAccessToken } from '../../apps/api/src/utils/jwt';
import { Roles, Permissions } from '@rrh-ems/shared';

const prisma = new PrismaClient();
const p = prisma as any;

let companyAId: number;
let companyBId: number;

let pmAUser: any;
let pmBUser: any;

let pmAToken: string;
let pmBToken: string;

let leadA: any;
let leadB: any;

let projectA: any;
let propertyA: any;

let oppA: any;

beforeAll(async () => {
  const ts = Date.now();

  // Setup Company A
  const companyA = await p.company.create({
    data: { name: `Test Company A ${ts}`, code: `C-A-${ts}` },
  });
  companyAId = companyA.id;

  // Setup Company B
  const companyB = await p.company.create({
    data: { name: `Test Company B ${ts}`, code: `C-B-${ts}` },
  });
  companyBId = companyB.id;

  // Setup Roles
  const pmRole = await p.role.upsert({
    where: { name: Roles.PROJECT_MANAGER },
    update: {},
    create: { name: Roles.PROJECT_MANAGER },
  });

  // Setup Users
  pmAUser = await p.employee.create({
    data: {
      employee_code: `PMA-${ts}`,
      full_name: 'PM A',
      email: `pma-${ts}@test.com`,
      phone: '1111111111',
      password_hash: 'hash',
      company_id: companyAId,
      status: 'ACTIVE',
      roles: { create: { role_id: pmRole.id } },
    },
    include: { roles: { include: { role: true } } },
  });

  pmBUser = await p.employee.create({
    data: {
      employee_code: `PMB-${ts}`,
      full_name: 'PM B',
      email: `pmb-${ts}@test.com`,
      phone: '2222222222',
      password_hash: 'hash',
      company_id: companyBId,
      status: 'ACTIVE',
      roles: { create: { role_id: pmRole.id } },
    },
    include: { roles: { include: { role: true } } },
  });

  pmAToken = generateAccessToken({
    employeeId: pmAUser.id,
    employeeCode: pmAUser.employee_code,
    companyId: companyAId,
    branchId: null,
    roles: [Roles.PROJECT_MANAGER],
    permissions: [Permissions.LEADS_UPDATE, Permissions.LEADS_READ, Permissions.SITE_VISITS_CREATE, 'tasks.create'],
  });

  pmBToken = generateAccessToken({
    employeeId: pmBUser.id,
    employeeCode: pmBUser.employee_code,
    companyId: companyBId,
    branchId: null,
    roles: [Roles.PROJECT_MANAGER],
    permissions: [Permissions.LEADS_UPDATE, Permissions.LEADS_READ, Permissions.SITE_VISITS_CREATE, 'tasks.create'],
  });

  // Setup Leads
  leadA = await p.lead.create({
    data: {
      lead_code: `LA-${ts}`,
      customer_name: 'Lead A',
      phone: `333${ts}`.slice(0, 10),
      company_id: companyAId,
      created_by_id: pmAUser.id,
      status: 'QUALIFIED',
    },
  });

  leadB = await p.lead.create({
    data: {
      lead_code: `LB-${ts}`,
      customer_name: 'Lead B',
      phone: `444${ts}`.slice(0, 10),
      company_id: companyBId,
      created_by_id: pmBUser.id,
      status: 'QUALIFIED',
    },
  });

  // Project & Property A
  projectA = await p.project.create({
    data: { name: 'Proj A', company_id: companyAId, location: 'Loc A', project_code: `PRJ-A-${ts}` }
  });

  propertyA = await p.property.create({
    data: {
      property_code: `PROP-A-${ts}`,
      title: 'Prop A',
      project_id: projectA.id,
      company_id: companyAId,
      created_by_id: pmAUser.id,
      status: 'AVAILABLE',
      category: 'APARTMENT',
      location: 'Loc A',
      price: 1000,
      area_sqft: 100
    }
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Phase 8 Packet 3 - Lead → Opportunity Integration', () => {

  it('1. Create Opportunity from valid Lead & check Lead transitions to OPPORTUNITY_OPEN', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: leadA.id,
        project_id: projectA.id,
        expected_value: 1000000
      });

    expect(res.status).toBe(201);
    oppA = res.body.opportunity;

    const leadAfter = await p.lead.findUnique({ where: { id: leadA.id } });
    expect(leadAfter?.status).toBe('OPPORTUNITY_OPEN');
  });

  it('2. Same Lead can create a second Opportunity', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: leadA.id,
        project_id: projectA.id,
        expected_value: 2000000
      });

    expect(res.status).toBe(201);
  });

  it('3. Historical Lead with NEGOTIATION remains unchanged', async () => {
    const legacyLead = await prisma.lead.create({
      data: {
        lead_code: `LA-LEGACY1-${Date.now()}`,
        customer_name: 'Legacy 1',
        phone: '9999999991',
        company_id: companyAId,
        created_by_id: pmAUser.id,
        status: 'NEGOTIATION'
      }
    });

    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: legacyLead.id,
        project_id: projectA.id,
      });

    expect(res.status).toBe(201);
    const leadAfter = await prisma.lead.findUnique({ where: { id: legacyLead.id } });
    expect(leadAfter?.status).toBe('NEGOTIATION');
  });

  it('4. Historical Lead with WON remains unchanged', async () => {
    const legacyLead = await prisma.lead.create({
      data: {
        lead_code: `LA-LEGACY2-${Date.now()}`,
        customer_name: 'Legacy 2',
        phone: '9999999992',
        company_id: companyAId,
        created_by_id: pmAUser.id,
        status: 'WON'
      }
    });

    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: legacyLead.id,
        project_id: projectA.id,
      });

    expect(res.status).toBe(201);
    const leadAfter = await prisma.lead.findUnique({ where: { id: legacyLead.id } });
    expect(leadAfter?.status).toBe('WON');
  });

  it('5. GET /leads/:id/opportunities returns only that Lead\'s Opportunities', async () => {
    const res = await request(app)
      .get(`/api/v1/leads/${leadA.id}/opportunities`)
      .set('Authorization', `Bearer ${pmAToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.opportunities.length).toBeGreaterThanOrEqual(2);
  });

  it('6. Cross-company Lead → Opportunity association is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: leadB.id,
        project_id: projectA.id,
      });
    expect(res.status).toBe(404);
  });

  it('7. Task with valid opportunity_id works', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        title: 'Call prospect',
        assignee_id: pmAUser.id,
        deadline: new Date(Date.now() + 86400).toISOString(),
        lead_id: leadA.id,
        opportunity_id: oppA.id
      });
    
    expect(res.status).toBe(201);
    expect(res.body.task.opportunity_id).toBe(oppA.id);
  });

  it('8. Task with mismatched Lead/Opportunity is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        title: 'Call prospect',
        assignee_id: pmAUser.id,
        deadline: new Date(Date.now() + 86400).toISOString(),
        lead_id: leadB.id,
        opportunity_id: oppA.id
      });
    
    expect(res.status).toBe(404); // Since leadB belongs to Company B, PM A gets 404. Let's try wrong lead same company.
  });

  it('8b. Task with mismatched Lead/Opportunity (same company) is rejected', async () => {
    const leadA2 = await p.lead.create({
      data: { lead_code: `LA-002-${Date.now()}`, customer_name: 'Lead A2', phone: '0000000000', company_id: companyAId, created_by_id: pmAUser.id }
    });

    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        title: 'Call prospect',
        assignee_id: pmAUser.id,
        deadline: new Date(Date.now() + 86400).toISOString(),
        lead_id: leadA2.id,
        opportunity_id: oppA.id
      });
    
    expect(res.status).toBe(400); // 400 for Opportunity does not belong to specified lead
  });

  it('9. Existing SiteVisit creation without opportunity_id still works', async () => {
    const res = await request(app)
      .post('/api/v1/site-visits')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: leadA.id,
        property_id: propertyA.id,
        scheduled_date: new Date(Date.now() + 86400).toISOString()
      });
    expect(res.status).toBe(201);
  });

  it('10. SiteVisit with valid opportunity_id works', async () => {
    const res = await request(app)
      .post('/api/v1/site-visits')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: leadA.id,
        opportunity_id: oppA.id,
        property_id: propertyA.id,
        scheduled_date: new Date(Date.now() + 86400).toISOString()
      });
    expect(res.status).toBe(201);
  });

  it('11. SiteVisit with mismatched Lead/Opportunity is rejected', async () => {
    const leadA2 = await p.lead.create({
      data: { lead_code: `LA-003-${Date.now()}`, customer_name: 'Lead A3', phone: '0001000000', company_id: companyAId, created_by_id: pmAUser.id }
    });

    const res = await request(app)
      .post('/api/v1/site-visits')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: leadA2.id,
        opportunity_id: oppA.id,
        scheduled_date: new Date(Date.now() + 86400).toISOString()
      });
    expect(res.status).toBe(400);
  });

  it('12. Cross-company SiteVisit/Opportunity association is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/site-visits')
      .set('Authorization', `Bearer ${pmBToken}`)
      .send({
        lead_id: leadB.id,
        opportunity_id: oppA.id,
        scheduled_date: new Date(Date.now() + 86400).toISOString()
      });
    expect(res.status).toBe(404);
  });

});
