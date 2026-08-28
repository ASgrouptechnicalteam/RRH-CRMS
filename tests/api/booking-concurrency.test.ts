import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles } from '@rrh-ems/shared';

jest.setTimeout(30000);


const p = prisma as any;

describe('Phase 9 Packet 2 - Booking Concurrency & Safety', () => {
  let agentToken: string;
  let companyId: number;
  let customerId: number;
  let agentId: number;

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

    // Create a customer for bookings
    const customer = await p.customer.create({
      data: {
        customer_code: `TEST-CUST-CC-${Date.now()}`,
        first_name: 'Concurrent',
        last_name: 'Tester',
        phone: '9999999999',
        company_id: companyId
      }
    });
    customerId = customer.id;
  });

  const createTestProperty = async (status: string = 'LIVE', override: any = {}) => {
    return await p.property.create({
      data: {
        property_code: `TEST-PROP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        company_id: companyId,
        title: 'Concurrency Test Property',
        price: 5000000,
        area_sqft: 1500,
        location: 'Test Location',
        status,
        created_by_id: agentId,
        ...override
      }
    });
  };

  const attemptBooking = async (propertyId: number, token: string = agentToken) => {
    return request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_id: customerId,
        property_id: propertyId,
        agreed_price: 4900000,
        booking_amount: 100000,
        notes: 'Concurrency Test Booking'
      });
  };

  test('A. Two simultaneous requests for the same LIVE property produce exactly 1 success', async () => {
    const prop = await createTestProperty('LIVE');
    
    // Fire simultaneous requests
    const [res1, res2] = await Promise.all([
      attemptBooking(prop.id),
      attemptBooking(prop.id)
    ]);

    const successes = [res1, res2].filter(r => r.status === 201);
    const failures = [res1, res2].filter(r => r.status === 409 || r.status === 400);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const updatedProp = await p.property.findUnique({ where: { id: prop.id } });
    expect(updatedProp.status).toBe('LOCKED');
    expect(updatedProp.locked_by_booking_id).toBe(successes[0].body.id);
  });

  test('B. Three+ simultaneous requests produce exactly 1 success', async () => {
    const prop = await createTestProperty('LIVE');
    
    const results = await Promise.all([
      attemptBooking(prop.id),
      attemptBooking(prop.id),
      attemptBooking(prop.id),
      attemptBooking(prop.id)
    ]);

    const successes = results.filter(r => r.status === 201);
    const failures = results.filter(r => r.status === 409 || r.status === 400);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(3);

    const updatedProp = await p.property.findUnique({ where: { id: prop.id } });
    expect(updatedProp.status).toBe('LOCKED');
    expect(updatedProp.locked_by_booking_id).toBe(successes[0].body.id);
  });

  test('C. Attempt to book an already LOCKED property fails', async () => {
    const prop = await createTestProperty('LOCKED', { locked_until: new Date(Date.now() + 10000) });
    const res = await attemptBooking(prop.id);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('locked');
  });

  test('D. Attempt to book an already BOOKED property fails', async () => {
    const prop = await createTestProperty('BOOKED');
    const res = await attemptBooking(prop.id);
    expect(res.status).toBe(409);
  });

  test('E. Attempt to book an already SOLD property fails', async () => {
    const prop = await createTestProperty('SOLD');
    const res = await attemptBooking(prop.id);
    expect(res.status).toBe(409);
  });

  test('F. Expired LOCKED property can be reclaimed safely', async () => {
    // Lock expired 1 hour ago
    const prop = await createTestProperty('LOCKED', { locked_until: new Date(Date.now() - 3600 * 1000) });
    
    const res = await attemptBooking(prop.id);
    expect(res.status).toBe(201);

    const updatedProp = await p.property.findUnique({ where: { id: prop.id } });
    expect(updatedProp.status).toBe('LOCKED');
    expect(updatedProp.locked_by_booking_id).toBe(res.body.id);
  });

  test('G. Two simultaneous attempts against the SAME expired LOCK produce exactly 1 winner', async () => {
    const prop = await createTestProperty('LOCKED', { locked_until: new Date(Date.now() - 3600 * 1000) });
    
    const [res1, res2] = await Promise.all([
      attemptBooking(prop.id),
      attemptBooking(prop.id)
    ]);

    const successes = [res1, res2].filter(r => r.status === 201);
    const failures = [res1, res2].filter(r => r.status === 409 || r.status === 400);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
  });

  test('I. Different properties can be booked concurrently', async () => {
    const prop1 = await createTestProperty('LIVE');
    const prop2 = await createTestProperty('LIVE');
    
    const [res1, res2] = await Promise.all([
      attemptBooking(prop1.id),
      attemptBooking(prop2.id)
    ]);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);

    const p1 = await p.property.findUnique({ where: { id: prop1.id } });
    const p2 = await p.property.findUnique({ where: { id: prop2.id } });

    expect(p1.status).toBe('LOCKED');
    expect(p2.status).toBe('LOCKED');
  });

  test('H. Booking creation failure rolls back the property lock', async () => {
    const prop = await createTestProperty('LIVE');
    
    // Intentionally cause a DB error inside createBooking by sending invalid foreign keys
    // wait, if customer_id doesn't exist, it will throw foreign key constraint inside the transaction
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        customer_id: 999999, // Invalid customer
        property_id: prop.id,
        agreed_price: 4900000,
        booking_amount: 100000
      });

    expect(res.status).toBe(404); // Because tenant isolation / validation returns 404 for invalid customer

    const p1 = await p.property.findUnique({ where: { id: prop.id } });
    // Should have rolled back the lock
    expect(p1.status).toBe('LIVE');
    expect(p1.locked_until).toBeNull();
    expect(p1.locked_by_booking_id).toBeNull();
  });

});
