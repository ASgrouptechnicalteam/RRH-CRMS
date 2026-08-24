import request from 'supertest';
import app from '../../apps/api/src/server';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('PHASE A - E2E CRM Lifecycle Workflow', () => {
  let mdToken: string;
  let telecallerToken: string;
  let leadId: number;
  let customerId: number;
  let siteVisitId: number;
  let opportunityId: number;
  let bookingId: number;
  let projectId: number;
  let propertyId: number;

  const uniquePhone = `999${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}1`;
  const pCode = `PRJ-${Date.now()}`;
  const propCode = `PROP-${Date.now()}`;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Must run in test env');
    }
    await setupDeterministicTestUsers();

    const login = async (code: string) => {
      const res = await request(app).post('/api/v1/auth/login').send({ employee_code: code, password: 'Password@123' });
      return res.body.accessToken;
    };

    const telecallerUser = deterministicUsers.find(u => u.roles[0] === Roles.TELECALLER)!;
    const mdUser = deterministicUsers.find(u => u.roles[0] === Roles.MD)!;

    telecallerToken = await login(telecallerUser.employee_code);
    mdToken = await login(mdUser.employee_code);

    // Create a deterministic project and property in the DB
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found');
    
    // We need the actual employee ID from the DB
    const dbUser = await prisma.employee.findUnique({ where: { employee_code: mdUser.employee_code } });
    if (!dbUser) throw new Error('No md found in db');

    const p = prisma as any;
    const project = await p.project.create({
      data: {
        company_id: company.id,
        project_code: pCode,
        name: 'E2E Test Project',
        location: 'Test City',
        status: 'ACTIVE'
      }
    });
    projectId = project.id;

    const property = await p.property.create({
      data: {
        company_id: company.id,
        project_id: projectId,
        property_code: propCode,
        title: 'E2E Test Property',
        category: 'VILLA',
        status: 'LIVE',
        price: 5000000,
        area_sqft: 1000,
        location: 'Test Location',
        created_by_id: dbUser.id
      }
    });
    propertyId = property.id;
  });

  it('1. Should authenticate and create a Lead', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({
        customer_name: 'E2E Lifecycle Lead',
        phone: uniquePhone,
        source: 'WEBSITE'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.lead).toBeDefined();
    leadId = res.body.lead.id;
  });

  it('2. Should convert Lead to Customer', async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${leadId}/convert-to-customer`)
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({});
    
    expect(res.status).toBe(201);
    expect(res.body.customer).toBeDefined();
    customerId = res.body.customer.id;
  });

  it('3. Should create a Site Visit', async () => {
    const res = await request(app)
      .post('/api/v1/site-visits')
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({
        lead_id: leadId,
        scheduled_date: new Date(Date.now() + 86400000).toISOString()
      });
    
    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    siteVisitId = res.body.booking.id;
  });

  it('4. Should create an Opportunity', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        lead_id: leadId,
        project_id: projectId,
        property_id: propertyId,
        expected_value: 5000000,
        probability: 50
      });
    
    expect(res.status).toBe(201);
    expect(res.body.opportunity).toBeDefined();
    opportunityId = res.body.opportunity.id;
  });

  it('4.5. Should update Opportunity stage through to BOOKING_INITIATED', async () => {
    const transitions = [
      'REQUIREMENT_CAPTURED',
      'PROPERTY_SHORTLISTED',
      'NEGOTIATION',
      'BOOKING_INITIATED'
    ];

    for (const stage of transitions) {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${opportunityId}/stage`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ stage });
      expect(res.status).toBe(200);
    }
  });

  it('5. Should convert Opportunity to Booking', async () => {
    const res = await request(app)
      .post(`/api/v1/opportunities/${opportunityId}/convert-to-booking`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        agreed_price: 5000000,
        booking_amount: 100000
      });
    
    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    bookingId = res.body.booking.id;
  });

  it('6. Should verify relationships', async () => {
    const res = await request(app)
      .get('/api/v1/leads')
      .set('Authorization', `Bearer ${telecallerToken}`);
    
    const leads = res.body.leads;
    const ourLead = leads.find((l: any) => l.id === leadId);
    
    expect(ourLead).toBeDefined();
    expect(ourLead.status).toBe('WON');
  });
});
