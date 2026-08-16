import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles } from '@rrh-ems/shared';

jest.setTimeout(45000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 9 Packet 3 - Opportunity -> Booking Integration', () => {
  let agentToken: string;
  let companyId: number;
  let agentId: number;
  let otherCompanyToken: string;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getAuth = async (code: string, idx: number = 0) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.1.${10 + idx}`)
        .send({
          employee_code: code,
          password: 'Password@123',
        });
      if (res.status !== 200) {
        throw new Error(`Login failed for ${code}: ${res.text}`);
      }
      return res.body.accessToken;
    };

    const agentCode = deterministicUsers.find(u => u.roles[0] === Roles.DIGITAL_LEAD_OPERATOR)!.employee_code;
    agentToken = await getAuth(agentCode, 1);

    const decoded = JSON.parse(Buffer.from(agentToken.split('.')[1], 'base64').toString());
    companyId = decoded.companyId;
    agentId = decoded.employeeId;

    // We need a token for a different company to test isolation
    const otherAgentCode = deterministicUsers.find(u => u.roles[0] === Roles.DIGITAL_LEAD_OPERATOR && u.company_id !== companyId)?.employee_code;
    if (otherAgentCode) {
      otherCompanyToken = await getAuth(otherAgentCode, 2);
    }
  });

  const createTestProperty = async (status: string = 'LIVE', override: any = {}) => {
    return await p.property.create({
      data: {
        property_code: `TEST-PROP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        title: 'Integration Test Property',
        price: 5000000,
        area_sqft: 1500,
        location: 'Test Location',
        status,
        company: { connect: { id: companyId } },
        created_by: { connect: { id: agentId } },
        ...override
      }
    });
  };

  const createTestLead = async (company_id: number = companyId) => {
    return await p.lead.create({
      data: {
        lead_code: `TEST-LEAD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        customer_name: `Test Lead ${Math.floor(Math.random() * 1000)}`,
        phone: `99${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        status: 'NEW',
        company: { connect: { id: company_id } },
        assigned_to: { connect: { id: agentId } },
        created_by: { connect: { id: agentId } },
      }
    });
  };

  const createTestOpportunity = async (leadId: number, propertyId: number, stage: string = 'BOOKING_INITIATED', company_id: number = companyId) => {
    return await p.opportunity.create({
      data: {
        opportunity_code: `TEST-OPP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        stage,
        company: { connect: { id: company_id } },
        lead: { connect: { id: leadId } },
        property: { connect: { id: propertyId } },
        owner: { connect: { id: agentId } },
      }
    });
  };

  const attemptConversion = async (oppId: number, token: string = agentToken, overrides: any = {}) => {
    return request(app)
      .post(`/api/v1/opportunities/${oppId}/convert-to-booking`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        agreed_price: 4900000,
        booking_amount: 100000,
        notes: 'Conversion Test Booking',
        ...overrides
      });
  };

  test('A. Successful BOOKING_INITIATED -> Customer -> Booking conversion', async () => {
    const prop = await createTestProperty('LIVE');
    const lead = await createTestLead();
    const opp = await createTestOpportunity(lead.id, prop.id, 'BOOKING_INITIATED');

    const res = await attemptConversion(opp.id);
    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();

    const bookingId = res.body.booking.id;

    // Verify DB State
    const updatedOpp = await p.opportunity.findUnique({ where: { id: opp.id } });
    expect(updatedOpp.booking_id).toBe(bookingId);

    const updatedProp = await p.property.findUnique({ where: { id: prop.id } });
    expect(updatedProp.status).toBe('LOCKED');
    expect(updatedProp.locked_by_booking_id).toBe(bookingId);

    const booking = await p.booking.findUnique({ where: { id: bookingId } });
    expect(booking.customer_id).toBeDefined();

    const customer = await p.customer.findUnique({ where: { id: booking.customer_id } });
    expect(customer.origin_lead_id).toBe(lead.id);
  });

  test('B. Non-existent Opportunity', async () => {
    const res = await attemptConversion(999999);
    expect(res.status).toBe(404);
  });

  test('C. Opportunity not accessible due to tenant isolation', async () => {
    if (!otherCompanyToken) {
      console.warn('Skipping C due to single tenant fixture');
      return;
    }
    const prop = await createTestProperty('LIVE');
    const lead = await createTestLead();
    const opp = await createTestOpportunity(lead.id, prop.id, 'BOOKING_INITIATED');

    const res = await attemptConversion(opp.id, otherCompanyToken);
    expect(res.status).toBe(404); // Or 403, usually 404 for tenant isolation
  });

  test('D. Opportunity in invalid stage', async () => {
    const prop = await createTestProperty('LIVE');
    const lead = await createTestLead();
    const opp = await createTestOpportunity(lead.id, prop.id, 'PROSPECT_QUALIFIED');

    const res = await attemptConversion(opp.id);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('BOOKING_INITIATED stage');
  });

  test('E. Opportunity already has Booking / Idempotency (N)', async () => {
    const prop = await createTestProperty('LIVE');
    const lead = await createTestLead();
    const opp = await createTestOpportunity(lead.id, prop.id, 'BOOKING_INITIATED');

    const firstRes = await attemptConversion(opp.id);
    expect(firstRes.status).toBe(201);

    // Repeated call should return existing booking (Idempotent)
    const secondRes = await attemptConversion(opp.id);
    expect(secondRes.status).toBe(201);
    expect(secondRes.body.booking.id).toBe(firstRes.body.booking.id);
  });

  test('F. Existing Customer from Lead is reused', async () => {
    const prop1 = await createTestProperty('LIVE');
    const lead = await createTestLead();
    
    // Convert first opp to create the customer
    const opp1 = await createTestOpportunity(lead.id, prop1.id, 'BOOKING_INITIATED');
    const res1 = await attemptConversion(opp1.id);
    expect(res1.status).toBe(201);
    const customerId = res1.body.booking.customer_id;

    // Convert second opp for the SAME lead (different property)
    const prop2 = await createTestProperty('LIVE');
    const opp2 = await createTestOpportunity(lead.id, prop2.id, 'BOOKING_INITIATED');
    const res2 = await attemptConversion(opp2.id);
    expect(res2.status).toBe(201);

    // Verify SAME customer was used
    expect(res2.body.booking.customer_id).toBe(customerId);
  });

  test('G. Two simultaneous conversions of the SAME Opportunity', async () => {
    const prop = await createTestProperty('LIVE');
    const lead = await createTestLead();
    const opp = await createTestOpportunity(lead.id, prop.id, 'BOOKING_INITIATED');

    const [res1, res2] = await Promise.all([
      attemptConversion(opp.id),
      attemptConversion(opp.id)
    ]);

    const successes = [res1, res2].filter(r => r.status === 201);
    const conflicts = [res1, res2].filter(r => r.status === 409);

    // One succeeds, one conflicts on optimistic update if they hit exact same window.
    // Or if one wins entirely before the other starts, idempotency returns 201 for both.
    // We just verify the end state is clean.
    expect(successes.length).toBeGreaterThan(0);

    const updatedOpp = await p.opportunity.findUnique({ where: { id: opp.id } });
    expect(updatedOpp.booking_id).not.toBeNull();
    
    // Exactly one booking should exist for this opportunity
    const bookings = await p.booking.findMany({ where: { property_id: prop.id } });
    expect(bookings.length).toBe(1);
  });

  test('H. Two different Opportunities targeting the SAME Property', async () => {
    const prop = await createTestProperty('LIVE');
    
    const lead1 = await createTestLead();
    const lead2 = await createTestLead();

    const opp1 = await createTestOpportunity(lead1.id, prop.id, 'BOOKING_INITIATED');
    const opp2 = await createTestOpportunity(lead2.id, prop.id, 'BOOKING_INITIATED');

    const [res1, res2] = await Promise.all([
      attemptConversion(opp1.id),
      attemptConversion(opp2.id)
    ]);

    const successes = [res1, res2].filter(r => r.status === 201);
    const conflicts = [res1, res2].filter(r => r.status === 409 || r.status === 400);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(1);

    const updatedProp = await p.property.findUnique({ where: { id: prop.id } });
    expect(updatedProp.status).toBe('LOCKED');
    expect(updatedProp.locked_by_booking_id).toBe(successes[0].body.booking.id);
  });

  test('I. Different Opportunities targeting different Properties', async () => {
    const prop1 = await createTestProperty('LIVE');
    const prop2 = await createTestProperty('LIVE');
    
    const lead1 = await createTestLead();
    const lead2 = await createTestLead();

    const opp1 = await createTestOpportunity(lead1.id, prop1.id, 'BOOKING_INITIATED');
    const opp2 = await createTestOpportunity(lead2.id, prop2.id, 'BOOKING_INITIATED');

    const [res1, res2] = await Promise.all([
      attemptConversion(opp1.id),
      attemptConversion(opp2.id)
    ]);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
  });
});
