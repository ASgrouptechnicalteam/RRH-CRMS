import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles } from '@rrh-ems/shared';

jest.setTimeout(30000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 11 Packet 3A - Portal Handoff Foundation', () => {
  let mdToken: string;
  let telecallerToken: string;
  let companyId: number;
  let agentId: number;
  let customerId: number;
  let propertyId: number;
  let bookingId: number;

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

    const mdCode = deterministicUsers.find(u => u.roles[0] === Roles.MD)!.employee_code;
    mdToken = await getAuth(mdCode, 0);

    const agentCode = deterministicUsers.find(u => u.roles[0] === Roles.TELECALLER)!.employee_code;
    telecallerToken = await getAuth(agentCode, 1);

    const decoded = JSON.parse(Buffer.from(mdToken.split('.')[1], 'base64').toString());
    companyId = decoded.companyId;
    agentId = decoded.employeeId;

    // Create test customer with KYC
    const customer = await p.customer.create({
      data: {
        customer_code: `TEST-CUST-PH-${Date.now()}`,
        first_name: 'Portal',
        last_name: 'Handoff',
        phone: '9999999999',
        company_id: companyId,
        pan_number: 'ABCDE1234F',
        aadhaar_number: '123456789012',
      }
    });
    customerId = customer.id;

    // Create test property
    const property = await p.property.create({
      data: {
        property_code: `TEST-PROP-PH-${Date.now()}`,
        company_id: companyId,
        title: 'Portal Handoff Test Property',
        price: 5000000,
        area_sqft: 1500,
        location: 'Test Location',
        category: 'VILLA',
        status: 'LIVE',
        created_by_id: agentId,
      }
    });
    propertyId = property.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (bookingId) {
      await p.integrationEvent.deleteMany({ where: { crms_booking_id: bookingId } });
      await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: bookingId } });
      await p.booking.deleteMany({ where: { id: bookingId } });
    }
    if (propertyId) {
      await p.property.deleteMany({ where: { id: propertyId } });
    }
    if (customerId) {
      await p.customer.deleteMany({ where: { id: customerId } });
    }
  });

  const createTestBooking = async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        customer_id: customerId,
        property_id: propertyId,
        agreed_price: 4900000,
        booking_amount: 100000,
        notes: 'Portal Handoff Test Booking'
      });
    return res;
  };

  const confirmTestBooking = async (id: number) => {
    const res = await request(app)
      .post(`/api/v1/bookings/${id}/confirm`)
      .set('Authorization', `Bearer ${mdToken}`);
    return res;
  };

  test('1. Confirmed booking creates IntegrationEvent', async () => {
    const createRes = await createTestBooking();
    expect(createRes.status).toBe(201);
    bookingId = createRes.body.id;

    // First mark token received
    const tokenRes = await request(app)
      .put(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'TOKEN_RECEIVED' });
    expect(tokenRes.status).toBe(200);

    const confirmRes = await confirmTestBooking(bookingId);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('CONFIRMED');

    const event = await p.integrationEvent.findFirst({
      where: { crms_booking_id: bookingId }
    });
    expect(event).toBeTruthy();
  });

  test('2. IntegrationEvent status is CREATED', async () => {
    const event = await p.integrationEvent.findFirst({
      where: { crms_booking_id: bookingId }
    });
    expect(event).toBeTruthy();
    expect(event.status).toBe('CREATED');
  });

  test('3. Event is created atomically with booking confirmation', async () => {
    const event = await p.integrationEvent.findFirst({
      where: { crms_booking_id: bookingId }
    });
    expect(event).toBeTruthy();
    expect(event.event_type).toBe('BOOKING_PORTAL_HANDOFF');
    expect(event.company_id).toBe(companyId);
  });

  test('4. BookingPortalMapping is created with CREATED status', async () => {
    const mapping = await p.bookingPortalMapping.findFirst({
      where: { crms_booking_id: bookingId }
    });
    expect(mapping).toBeTruthy();
    expect(mapping.handoff_status).toBe('CREATED');
    expect(mapping.crms_customer_id).toBe(customerId);
    expect(mapping.company_id).toBe(companyId);
    expect(mapping.portal_customer_id).toBeNull();
    expect(mapping.portal_booking_id).toBeNull();
  });

  test('5. Event payload contains approved fields only', async () => {
    const event = await p.integrationEvent.findFirst({
      where: { crms_booking_id: bookingId }
    });
    const payload = JSON.parse(event.payload);

    // Should contain
    expect(payload.customer).toBeTruthy();
    expect(payload.customer.crms_customer_id).toBe(customerId);
    expect(payload.customer.customer_code).toBeTruthy();
    expect(payload.customer.first_name).toBe('Portal');
    expect(payload.customer.phone).toBeTruthy();

    expect(payload.booking).toBeTruthy();
    expect(payload.booking.crms_booking_id).toBe(bookingId);
    expect(payload.booking.booking_code).toBeTruthy();
    expect(payload.booking.agreed_price).toBe(4900000);

    expect(payload.property).toBeTruthy();
    expect(payload.property.title).toBe('Portal Handoff Test Property');

    expect(payload.company_id).toBe(companyId);
  });

  test('6. Event payload excludes KYC/bank/password data', async () => {
    const event = await p.integrationEvent.findFirst({
      where: { crms_booking_id: bookingId }
    });
    const payload = JSON.parse(event.payload);

    // Should NOT contain sensitive data
    expect(payload.customer.pan_number).toBeUndefined();
    expect(payload.customer.aadhaar_number).toBeUndefined();
    expect(payload.customer.password_hash).toBeUndefined();
    expect(payload.customer.bank_account_number).toBeUndefined();
    expect(payload.customer.bank_ifsc).toBeUndefined();
  });

  test('7. Handoff status respects company isolation', async () => {
    // Create a booking in a different company
    const otherCompany = await p.company.create({
      data: { name: 'Other Test Company', code: `OTHER-${Date.now()}` }
    });
    const otherEmployee = await p.employee.create({
      data: {
        employee_code: `RRH-OTH-${Date.now()}`,
        full_name: 'Other Employee',
        phone: '8888888888',
        password_hash: 'hash',
        company_id: otherCompany.id,
        status: 'ACTIVE',
      }
    });
    const otherCustomer = await p.customer.create({
      data: {
        customer_code: `CUST-OTH-${Date.now()}`,
        first_name: 'Other',
        phone: '7777777777',
        company_id: otherCompany.id,
      }
    });
    const otherProperty = await p.property.create({
      data: {
        property_code: `PROP-OTH-${Date.now()}`,
        company_id: otherCompany.id,
        title: 'Other Property',
        price: 3000000,
        area_sqft: 1000,
        location: 'Other Location',
        category: 'PLOT',
        status: 'LIVE',
        created_by_id: otherEmployee.id,
      }
    });

    // Create and confirm booking in other company
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        customer_id: otherCustomer.id,
        property_id: otherProperty.id,
        agreed_price: 2900000,
        booking_amount: 50000,
      });

    // This should fail because mdToken is from a different company
    expect(createRes.status).toBe(404);

    // Cleanup
    await p.property.deleteMany({ where: { id: otherProperty.id } });
    await p.customer.deleteMany({ where: { id: otherCustomer.id } });
    await p.employee.deleteMany({ where: { id: otherEmployee.id } });
    await p.company.deleteMany({ where: { id: otherCompany.id } });
  });

  test('8. Handoff status endpoint returns mapping', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${bookingId}/handoff-status`)
      .set('Authorization', `Bearer ${mdToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
    expect(res.body.handoff_status).toBe('CREATED');
    expect(res.body.crms_booking_id).toBe(bookingId);
  });

  test('9. Non-management non-assigned users cannot access handoff status', async () => {
    // Telecaller is not management and the booking is not assigned to them
    // BookingPolicy.canView returns false for non-management non-assigned users
    const res = await request(app)
      .get(`/api/v1/bookings/${bookingId}/handoff-status`)
      .set('Authorization', `Bearer ${telecallerToken}`);

    expect(res.status).toBe(403);
  });

  test('10. Existing booking behavior remains unchanged', async () => {
    // Create a fresh property for this test
    const freshProperty = await p.property.create({
      data: {
        property_code: `TEST-PROP-FRESH-${Date.now()}`,
        company_id: companyId,
        title: 'Fresh Test Property',
        price: 5000000,
        area_sqft: 1500,
        location: 'Fresh Location',
        category: 'VILLA',
        status: 'LIVE',
        created_by_id: agentId,
      }
    });

    // Create a new booking without triggering handoff
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        customer_id: customerId,
        property_id: freshProperty.id,
        agreed_price: 4900000,
        booking_amount: 100000,
      });
    expect(createRes.status).toBe(201);
    const newBookingId = createRes.body.id;

    // Verify no handoff event for unconfirmed booking
    const event = await p.integrationEvent.findFirst({
      where: { crms_booking_id: newBookingId }
    });
    expect(event).toBeNull();

    // Verify no mapping for unconfirmed booking
    const mapping = await p.bookingPortalMapping.findFirst({
      where: { crms_booking_id: newBookingId }
    });
    expect(mapping).toBeNull();

    // Cleanup
    await p.booking.deleteMany({ where: { id: newBookingId } });
    await p.property.deleteMany({ where: { id: freshProperty.id } });
  });
});
