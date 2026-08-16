import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles } from '@rrh-ems/shared';
import { PortalWorker } from '../../apps/api/src/services/portalWorker';

jest.setTimeout(30000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 11 Packet 3B - Portal Worker', () => {
  let mdToken: string;
  let companyId: number;
  let agentId: number;
  let customerId: number;
  let propertyId: number;
  let bookingId: number;
  let eventId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    process.env.PORTAL_API_URL = 'http://localhost:9999';
    process.env.CRM_PORTAL_SECRET = 'test-crm-portal-secret-at-least-32-chars';
    process.env.PORTAL_CRM_SECRET = 'test-portal-crm-secret-at-least-32-chars';

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

    const decoded = JSON.parse(Buffer.from(mdToken.split('.')[1], 'base64').toString());
    companyId = decoded.companyId;
    agentId = decoded.employeeId;

    const customer = await p.customer.create({
      data: {
        customer_code: `TEST-CUST-W-${Date.now()}`,
        first_name: 'Worker',
        last_name: 'Test',
        phone: '7777777777',
        company_id: companyId,
        pan_number: 'ABCDE1234F',
        aadhaar_number: '123456789012',
      }
    });
    customerId = customer.id;

    const property = await p.property.create({
      data: {
        property_code: `TEST-PROP-W-${Date.now()}`,
        company_id: companyId,
        title: 'Worker Test Property',
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
    PortalWorker.stop();
  });

  const createFreshProperty = async () => {
    const prop = await p.property.create({
      data: {
        property_code: `TEST-PROP-W-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        company_id: companyId,
        title: `Worker Test Property ${Math.floor(Math.random() * 10000)}`,
        price: 5000000,
        area_sqft: 1500,
        location: 'Test Location',
        category: 'VILLA',
        status: 'LIVE',
        created_by_id: agentId,
      }
    });
    return prop.id;
  };

  const createConfirmedBooking = async (freshPropertyId: number) => {
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        customer_id: customerId,
        property_id: freshPropertyId,
        agreed_price: 4900000,
        booking_amount: 100000,
        notes: 'Portal Worker Test Booking'
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const tokenRes = await request(app)
      .put(`/api/v1/bookings/${id}/status`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'TOKEN_RECEIVED' });
    expect(tokenRes.status).toBe(200);

    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${id}/confirm`)
      .set('Authorization', `Bearer ${mdToken}`);
    expect(confirmRes.status).toBe(200);

    return id;
  };

  const getEvent = async (bookingId: number) => {
    return p.integrationEvent.findFirst({ where: { crms_booking_id: bookingId } });
  };

  const mockFetch = (statusCode: number, body: any) => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      status: statusCode,
      json: jest.fn().mockResolvedValue(body),
    });
  };

  test('1. Worker claims an event atomically and posts handoff to Portal', async () => {
    const freshProp = await createFreshProperty();
    bookingId = await createConfirmedBooking(freshProp);
    eventId = (await getEvent(bookingId)).id;

    mockFetch(200, {
      status: 'accepted',
      portal_customer_id: 'PORTAL-CUST-W1',
      portal_booking_id: 'PORTAL-BKG-W1',
    });

    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    // Verify fetch was called with correct URL, auth, and idempotency key
    const fetchMock = (global as any).fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:9999/api/v1/portal/handoff');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe(`Bearer ${process.env.CRM_PORTAL_SECRET}`);
    const sentBody = JSON.parse(options.body);
    expect(sentBody.idempotency_key).toBe(`crms-evt-${eventId}`);
    expect(sentBody.booking.crms_booking_id).toBe(bookingId);
  });

  test('2. Successful handoff updates IntegrationEvent to COMPLETED', async () => {
    const event = await p.integrationEvent.findUnique({ where: { id: eventId } });
    expect(event.status).toBe('COMPLETED');
    expect(event.processed_at).toBeTruthy();
  });

  test('3. Successful handoff updates BookingPortalMapping to WAITING_ACTIVATION', async () => {
    const mapping = await p.bookingPortalMapping.findFirst({ where: { crms_booking_id: bookingId } });
    expect(mapping.handoff_status).toBe('WAITING_ACTIVATION');
    expect(mapping.portal_customer_id).toBe('PORTAL-CUST-W1');
    expect(mapping.portal_booking_id).toBe('PORTAL-BKG-W1');
  });

  test('4. Portal error (5xx) is retryable, increments retry_count, resets to CREATED', async () => {
    // Create a fresh booking for this test
    const freshProp = await createFreshProperty();
    const freshBookingId = await createConfirmedBooking(freshProp);
    const freshEvent = await getEvent(freshBookingId);

    mockFetch(500, { status: 'error', code: 'INTERNAL_ERROR' });

    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const afterFirst = await p.integrationEvent.findUnique({ where: { id: freshEvent.id } });
    expect(afterFirst.status).toBe('CREATED');
    expect(afterFirst.retry_count).toBe(1);
    expect(afterFirst.error_message).toContain('500');

    // Second attempt still retryable
    mockFetch(503, { status: 'error', code: 'INTERNAL_ERROR' });
    await PortalWorker.processNextEvent();
    const afterSecond = await p.integrationEvent.findUnique({ where: { id: freshEvent.id } });
    expect(afterSecond.status).toBe('CREATED');
    expect(afterSecond.retry_count).toBe(2);

    // Third attempt exceeds max_retries → terminal FAILED
    mockFetch(503, { status: 'error', code: 'INTERNAL_ERROR' });
    await PortalWorker.processNextEvent();
    const afterThird = await p.integrationEvent.findUnique({ where: { id: freshEvent.id } });
    expect(afterThird.status).toBe('FAILED');
    expect(afterThird.retry_count).toBe(3);

    // Mapping marked FAILED
    const mapping = await p.bookingPortalMapping.findFirst({ where: { crms_booking_id: freshBookingId } });
    expect(mapping.handoff_status).toBe('FAILED');

    await p.integrationEvent.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.booking.deleteMany({ where: { id: freshBookingId } });
    await p.property.deleteMany({ where: { id: freshProp } });
  });

  test('5. Network error (fetch throws) is retryable', async () => {
    const freshProp = await createFreshProperty();
    const freshBookingId = await createConfirmedBooking(freshProp);
    const freshEvent = await getEvent(freshBookingId);

    (global as any).fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const after = await p.integrationEvent.findUnique({ where: { id: freshEvent.id } });
    expect(after.status).toBe('CREATED');
    expect(after.retry_count).toBe(1);

    await p.integrationEvent.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.booking.deleteMany({ where: { id: freshBookingId } });
    await p.property.deleteMany({ where: { id: freshProp } });
  });

  test('6. Portal rejection (status error, non-DUPLICATE) is terminal FAILED', async () => {
    const freshProp = await createFreshProperty();
    const freshBookingId = await createConfirmedBooking(freshProp);
    const freshEvent = await getEvent(freshBookingId);

    mockFetch(200, { status: 'error', code: 'INVALID_PAYLOAD', message: 'Schema validation failed' });

    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const after = await p.integrationEvent.findUnique({ where: { id: freshEvent.id } });
    expect(after.status).toBe('FAILED');
    expect(after.error_message).toContain('Schema validation failed');

    await p.integrationEvent.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.booking.deleteMany({ where: { id: freshBookingId } });
    await p.property.deleteMany({ where: { id: freshProp } });
  });

  test('7. DUPLICATE_BOOKING response is treated as already delivered (COMPLETED)', async () => {
    const freshProp = await createFreshProperty();
    const freshBookingId = await createConfirmedBooking(freshProp);
    const freshEvent = await getEvent(freshBookingId);

    mockFetch(200, {
      status: 'error',
      code: 'DUPLICATE_BOOKING',
      portal_customer_id: 'PORTAL-CUST-EXIST',
      portal_booking_id: 'PORTAL-BKG-EXIST',
      message: 'Booking already exists',
    });

    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const after = await p.integrationEvent.findUnique({ where: { id: freshEvent.id } });
    expect(after.status).toBe('COMPLETED');

    const mapping = await p.bookingPortalMapping.findFirst({ where: { crms_booking_id: freshBookingId } });
    expect(mapping.handoff_status).toBe('WAITING_ACTIVATION');
    expect(mapping.portal_customer_id).toBe('PORTAL-CUST-EXIST');

    await p.integrationEvent.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.booking.deleteMany({ where: { id: freshBookingId } });
    await p.property.deleteMany({ where: { id: freshProp } });
  });

  test('8. Worker does not start when PORTAL_WORKER_ENABLED is false (default)', async () => {
    process.env.PORTAL_WORKER_ENABLED = 'false';
    const startSpy = jest.spyOn(PortalWorker, 'processNextEvent').mockResolvedValue(false);
    PortalWorker.start();
    expect(startSpy).not.toHaveBeenCalled();
    startSpy.mockRestore();
    PortalWorker.stop();
  });

  test('9. Worker respects max_retries from event record', async () => {
    // Verify max_retries default is 3 in DB
    const freshProp = await createFreshProperty();
    const freshBookingId = await createConfirmedBooking(freshProp);
    const freshEvent = await getEvent(freshBookingId);
    expect(freshEvent.max_retries).toBe(3);
    await p.integrationEvent.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.booking.deleteMany({ where: { id: freshBookingId } });
    await p.property.deleteMany({ where: { id: freshProp } });
  });
});