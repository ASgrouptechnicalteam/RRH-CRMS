import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles } from '@rrh-ems/shared';

jest.setTimeout(30000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 11 Packet 3B - Portal Callback', () => {
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

    process.env.PORTAL_CRM_SECRET = 'test-portal-crm-secret-at-least-32-chars';
    process.env.PORTAL_API_URL = 'http://localhost:9999';
    process.env.CRM_PORTAL_SECRET = 'test-crm-portal-secret-at-least-32-chars';

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
        customer_code: `TEST-CUST-3B-${Date.now()}`,
        first_name: 'Callback',
        last_name: 'Test',
        phone: '8888888888',
        company_id: companyId,
        pan_number: 'ABCDE1234F',
        aadhaar_number: '123456789012',
      }
    });
    customerId = customer.id;

    const property = await p.property.create({
      data: {
        property_code: `TEST-PROP-3B-${Date.now()}`,
        company_id: companyId,
        title: 'Callback Test Property',
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
      await p.customerNotification.deleteMany({ where: { customer_id: customerId } });
      await p.integrationEvent.deleteMany({ where: { crms_booking_id: bookingId } });
      await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: bookingId } });
      await p.booking.deleteMany({ where: { id: bookingId } });
    }
    if (propertyId) {
      await p.property.deleteMany({ where: { id: propertyId } });
    }
    if (customerId) {
      await p.customerNotification.deleteMany({ where: { customer_id: customerId } });
      await p.customer.deleteMany({ where: { id: customerId } });
    }
  });

  const createConfirmedBooking = async () => {
    return createConfirmedBookingForProperty(propertyId);
  };

  const createConfirmedBookingForProperty = async (propId: number) => {
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        customer_id: customerId,
        property_id: propId,
        agreed_price: 4900000,
        booking_amount: 100000,
        notes: 'Portal Callback Test Booking'
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

  const getEventId = async (bookingId: number) => {
    const event = await p.integrationEvent.findFirst({ where: { crms_booking_id: bookingId } });
    return event.id;
  };

  const setMappingStatus = async (bookingId: number, status: string) => {
    await p.bookingPortalMapping.updateMany({
      where: { crms_booking_id: bookingId },
      data: { handoff_status: status },
    });
  };

  test('1. Valid callback with status completed updates mapping to ACTIVE', async () => {
    bookingId = await createConfirmedBooking();
    eventId = await getEventId(bookingId);

    // Simulate worker having delivered → WAITING_ACTIVATION
    await setMappingStatus(bookingId, 'WAITING_ACTIVATION');

    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        idempotency_key: `crms-evt-${eventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        portal_customer_id: 'PORTAL-CUST-1',
        portal_booking_id: 'PORTAL-BKG-1',
        company_id: companyId,
        crms_booking_id: bookingId,
        message: 'Customer activated',
      });

    expect(res.status).toBe(200);

    const mapping = await p.bookingPortalMapping.findFirst({ where: { crms_booking_id: bookingId } });
    expect(mapping.handoff_status).toBe('ACTIVE');
    expect(mapping.portal_customer_id).toBe('PORTAL-CUST-1');
    expect(mapping.portal_booking_id).toBe('PORTAL-BKG-1');
  });

  test('2. Duplicate callback (already ACTIVE) returns 200 without re-processing', async () => {
    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        idempotency_key: `crms-evt-${eventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        portal_customer_id: 'PORTAL-CUST-X',
        portal_booking_id: 'PORTAL-BKG-X',
        company_id: companyId,
        crms_booking_id: bookingId,
        message: 'Duplicate',
      });

    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);

    // Original portal IDs preserved
    const mapping = await p.bookingPortalMapping.findFirst({ where: { crms_booking_id: bookingId } });
    expect(mapping.portal_customer_id).toBe('PORTAL-CUST-1');
  });

  test('3. Invalid service token returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', 'Bearer wrong-secret')
      .send({
        idempotency_key: `crms-evt-${eventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        portal_customer_id: 'PORTAL-CUST-1',
        portal_booking_id: 'PORTAL-BKG-1',
        company_id: companyId,
        crms_booking_id: bookingId,
      });

    expect(res.status).toBe(401);
  });

  test('4. Missing service token returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .send({
        idempotency_key: `crms-evt-${eventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        company_id: companyId,
        crms_booking_id: bookingId,
      });

    expect(res.status).toBe(401);
  });

  test('5. Missing required fields returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        company_id: companyId,
        crms_booking_id: bookingId,
      });

    expect(res.status).toBe(400);
  });

  test('6. Cross-company callback (company mismatch) returns 403', async () => {
    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        idempotency_key: `crms-evt-${eventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        portal_customer_id: 'PORTAL-CUST-1',
        portal_booking_id: 'PORTAL-BKG-1',
        company_id: 9999,
        crms_booking_id: bookingId,
      });

    expect(res.status).toBe(403);
  });

  test('7. Unknown booking returns 404', async () => {
    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        idempotency_key: `crms-evt-999999`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        portal_customer_id: 'PORTAL-CUST-1',
        portal_booking_id: 'PORTAL-BKG-1',
        company_id: companyId,
        crms_booking_id: 999999,
      });

    expect(res.status).toBe(404);
  });

  test('8. Callback while mapping is still CREATED returns 409', async () => {
    // Create a fresh property + confirmed booking but do NOT simulate delivery
    const freshProperty = await p.property.create({
      data: {
        property_code: `TEST-PROP-CB8-${Date.now()}`,
        company_id: companyId,
        title: 'Callback Test Property 8',
        price: 4800000,
        area_sqft: 1400,
        location: 'Test Location',
        category: 'VILLA',
        status: 'LIVE',
        created_by_id: agentId,
      }
    });
    const freshBookingId = await createConfirmedBookingForProperty(freshProperty.id);
    const freshEventId = await getEventId(freshBookingId);

    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        idempotency_key: `crms-evt-${freshEventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        portal_customer_id: 'PORTAL-CUST-2',
        portal_booking_id: 'PORTAL-BKG-2',
        company_id: companyId,
        crms_booking_id: freshBookingId,
      });

    expect(res.status).toBe(409);

    await p.integrationEvent.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.booking.deleteMany({ where: { id: freshBookingId } });
    await p.property.deleteMany({ where: { id: freshProperty.id } });
  });

  test('9. Callback does not modify IntegrationEvent (delivery state untouched)', async () => {
    const event = await p.integrationEvent.findUnique({ where: { id: eventId } });
    expect(event.status).toBe('CREATED');
  });

  test('10. Audit event created for processed callback', async () => {
    const audit = await p.auditEvent.findFirst({
      where: {
        action: 'PORTAL_CALLBACK_RECEIVED',
        entity_id: bookingId,
      },
      orderBy: { created_at: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.new_value).toBe('ACTIVE');
  });

  test('11. Callback with status failed records failure but keeps lifecycle state', async () => {
    // Create fresh property + booking, simulate WAITING_ACTIVATION
    const freshProperty = await p.property.create({
      data: {
        property_code: `TEST-PROP-CB11-${Date.now()}`,
        company_id: companyId,
        title: 'Callback Test Property 11',
        price: 4700000,
        area_sqft: 1300,
        location: 'Test Location',
        category: 'VILLA',
        status: 'LIVE',
        created_by_id: agentId,
      }
    });
    const freshBookingId = await createConfirmedBookingForProperty(freshProperty.id);
    const freshEventId = await getEventId(freshBookingId);
    await setMappingStatus(freshBookingId, 'WAITING_ACTIVATION');

    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        idempotency_key: `crms-evt-${freshEventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'failed',
        company_id: companyId,
        crms_booking_id: freshBookingId,
        message: 'Customer could not verify OTP',
      });

    expect(res.status).toBe(200);

    const mapping = await p.bookingPortalMapping.findFirst({ where: { crms_booking_id: freshBookingId } });
    expect(mapping.handoff_status).toBe('WAITING_ACTIVATION');
    expect(mapping.error_message).toContain('OTP');

    await p.integrationEvent.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.bookingPortalMapping.deleteMany({ where: { crms_booking_id: freshBookingId } });
    await p.booking.deleteMany({ where: { id: freshBookingId } });
    await p.property.deleteMany({ where: { id: freshProperty.id } });
  });
});