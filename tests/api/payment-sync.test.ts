import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles, PAYMENT_EVENT_TYPE } from '@rrh-ems/shared';
import { PortalWorker } from '../../apps/api/src/services/portalWorker';

jest.setTimeout(45000);


const p = prisma as any;

describe('Phase 11 Packet 3F - Payment Synchronization', () => {
  let mdToken: string;
  let financeToken: string;
  let companyId: number;
  let agentId: number;
  let customerId: number;
  let propertyId: number;
  let bookingId: number;
  let installmentId: number;
  let paymentId: number;

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
        .set('X-Forwarded-For', `192.168.7.${10 + idx}`)
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
    const financeCode = deterministicUsers.find(u => u.roles[0] === Roles.FINANCE)!.employee_code;

    mdToken = await getAuth(mdCode, 0);
    financeToken = await getAuth(financeCode, 1);

    const decoded = JSON.parse(Buffer.from(mdToken.split('.')[1], 'base64').toString());
    companyId = decoded.companyId;
    agentId = decoded.employeeId;

    // Clean, isolated fixture for this packet
    await p.integrationEvent.deleteMany({ where: { event_type: PAYMENT_EVENT_TYPE } });
    await p.customerNotification.deleteMany({});
    await p.payment.deleteMany({});
    await p.installment.deleteMany({});
    await p.booking.deleteMany({});
    await p.document.deleteMany({});
    await p.complaint.deleteMany({});
    await p.customer.deleteMany({});
    await p.property.deleteMany({});

    const customer = await p.customer.create({
      data: {
        company_id: companyId,
        first_name: 'Payment Sync',
        last_name: 'Customer',
        phone: '8888888888',
        status: 'NEW',
        customer_code: `C-P3F-${Date.now()}`,
      },
    });
    customerId = customer.id;

    const property = await p.property.create({
      data: {
        title: 'Payment Sync Title',
        company_id: companyId,
        status: 'BOOKED',
        price: 10000000,
        bedrooms: 3,
        area_sqft: 1000,
        facing: 'EAST',
        property_code: `PROP-P3F-${Date.now()}`,
        location: 'Test Location',
        created_by_id: agentId,
      },
    });
    propertyId = property.id;

    const booking = await p.booking.create({
      data: {
        company_id: companyId,
        booking_code: `B-P3F-${Date.now()}`,
        customer_id: customerId,
        property_id: propertyId,
        agreed_price: 10000000,
        booking_amount: 100000,
        balance_amount: 9900000,
        status: 'INITIATED',
      },
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    await p.integrationEvent.deleteMany({ where: { crms_booking_id: bookingId } });
    await p.customerNotification.deleteMany({ where: { customer_id: customerId } });
    await p.auditEvent.deleteMany({ where: { entity_id: bookingId } });
    await p.payment.deleteMany({ where: { booking_id: bookingId } });
    await p.installment.deleteMany({ where: { booking_id: bookingId } });
    await p.booking.deleteMany({ where: { id: bookingId } });
    await p.document.deleteMany({ where: { customer_id: customerId } });
    await p.complaint.deleteMany({ where: { customer_id: customerId } });
    await p.customer.deleteMany({ where: { id: customerId } });
    await p.property.deleteMany({ where: { id: propertyId } });
    await prisma.$disconnect();
  });

  const mockFetch = (statusCode: number, body: any) => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      status: statusCode,
      json: jest.fn().mockResolvedValue(body),
    });
  };

  const createPaymentRecord = async (amount = 200000): Promise<number> => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        booking_id: bookingId,
        amount,
        payment_method: 'BANK_TRANSFER',
        reference_number: 'TXN-3F-001',
      });
    expect(res.status).toBe(201);
    return res.body.id;
  };

  // ─────────────────────────────────────────────────────────────
  // OUTBOUND: CRM → Portal
  // ─────────────────────────────────────────────────────────────

  test('1. verifyPayment SUCCESS emits PAYMENT_STATUS_CHANGED event + notification (no credentials)', async () => {
    paymentId = await createPaymentRecord(200000);

    const verifyRes = await request(app)
      .put(`/api/v1/payments/${paymentId}/status`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({ status: 'SUCCESS' });
    expect(verifyRes.status).toBe(200);

    const event = await p.integrationEvent.findFirst({
      where: { event_type: PAYMENT_EVENT_TYPE, crms_booking_id: bookingId },
      orderBy: { id: 'desc' },
    });
    expect(event).toBeTruthy();
    expect(event.status).toBe('CREATED');
    expect(event.company_id).toBe(companyId);
    expect(event.crms_customer_id).toBe(customerId);

    const payload = JSON.parse(event.payload);
    expect(payload.event_type).toBe(PAYMENT_EVENT_TYPE);
    expect(payload.payment_id).toBe(paymentId);
    expect(payload.amount).toBe(200000);
    expect(payload.status).toBe('SUCCESS');
    expect(payload.reference_number).toBe('TXN-3F-001');

    // Sensitive-data guard: payload must NOT contain financial credentials
    const raw = event.payload as string;
    expect(raw.toLowerCase()).not.toContain('cvv');
    expect(raw.toLowerCase()).not.toContain('upi');
    expect(raw.toLowerCase()).not.toContain('otp');
    expect(raw.toLowerCase()).not.toContain('netbanking');

    // Payment marked PENDING_SYNC for worker delivery
    const payment = await p.payment.findUnique({ where: { id: paymentId } });
    expect(payment.sync_status).toBe('PENDING_SYNC');

    // 3E notification — exactly one PAYMENT_STATUS_UPDATED (LOW sensitivity only)
    const notifications = await p.customerNotification.findMany({
      where: { customer_id: customerId, type: 'PAYMENT_STATUS_UPDATED' },
    });
    expect(notifications.length).toBe(1);
    expect(notifications[0].booking_id).toBe(bookingId);
    const msg = notifications[0].message.toLowerCase();
    expect(msg).not.toContain('cvv');
    expect(msg).not.toContain('upi');
  });

  test('2. Duplicate verifyPayment cannot emit a second event', async () => {
    const res = await request(app)
      .put(`/api/v1/payments/${paymentId}/status`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({ status: 'SUCCESS' });
    expect(res.status).toBe(400);

    const count = await p.integrationEvent.count({
      where: { event_type: PAYMENT_EVENT_TYPE, crms_booking_id: bookingId },
    });
    expect(count).toBe(1);
  });

  test('3. verifyPayment FAILED does NOT emit a sync event', async () => {
    const failedId = await createPaymentRecord(50000);
    const res = await request(app)
      .put(`/api/v1/payments/${failedId}/status`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({ status: 'FAILED' });
    expect(res.status).toBe(200);

    const payment = await p.payment.findUnique({ where: { id: failedId } });
    expect(payment.sync_status).toBe('LOCAL');

    const count = await p.integrationEvent.count({
      where: { event_type: PAYMENT_EVENT_TYPE, crms_booking_id: bookingId },
    });
    expect(count).toBe(1);
  });

  test('4. Worker delivers PAYMENT_STATUS_CHANGED to /payment-status and completes it', async () => {
    const event = await p.integrationEvent.findFirst({
      where: { event_type: PAYMENT_EVENT_TYPE, crms_booking_id: bookingId },
      orderBy: { id: 'desc' },
    });

    mockFetch(200, { status: 'accepted' });
    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const after = await p.integrationEvent.findUnique({ where: { id: event.id } });
    expect(after.status).toBe('COMPLETED');
    expect(after.processed_at).toBeTruthy();

    const completedAudit = await p.auditEvent.findFirst({
      where: { action: 'PAYMENT_SYNC_COMPLETED', entity_id: paymentId },
    });
    expect(completedAudit).toBeTruthy();
  });

  test('5. Worker retries on 5xx then goes terminal FAILED after max_retries', async () => {
    const payload = {
      event_type: PAYMENT_EVENT_TYPE,
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: paymentId,
      payment_code: 'RRH-PAY-TEST',
      installment_id: null,
      amount: 200000,
      status: 'SUCCESS',
      payment_date: new Date().toISOString(),
    };
    const event = await p.integrationEvent.create({
      data: {
        event_type: PAYMENT_EVENT_TYPE,
        payload: JSON.stringify(payload),
        status: 'CREATED',
        company_id: companyId,
        crms_booking_id: bookingId,
        crms_customer_id: customerId,
        max_retries: 2,
      },
    });

    // Attempt 1 — 5xx → retryable (back to CREATED)
    mockFetch(500, { status: 'error' });
    await PortalWorker.processNextEvent();
    let current = await p.integrationEvent.findUnique({ where: { id: event.id } });
    expect(current.status).toBe('CREATED');
    expect(current.retry_count).toBe(1);

    // Attempt 2 — 5xx again → terminal FAILED (max_retries reached)
    mockFetch(500, { status: 'error' });
    await PortalWorker.processNextEvent();
    current = await p.integrationEvent.findUnique({ where: { id: event.id } });
    expect(current.status).toBe('FAILED');
    expect(current.retry_count).toBe(2);

    const terminalAudit = await p.auditEvent.findFirst({
      where: { action: 'PAYMENT_SYNC_TERMINAL_FAILURE', entity_id: paymentId },
    });
    expect(terminalAudit).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────
  // INBOUND: Portal → CRM
  // ─────────────────────────────────────────────────────────────

  const createPendingSyncPayment = async () => {
    const rec = await createPaymentRecord(150000);
    // Emulate the outbound emission: PENDING_SYNC + a PAYMENT_STATUS_CHANGED event
    await p.payment.update({ where: { id: rec }, data: { sync_status: 'PENDING_SYNC' } });
    const event = await p.integrationEvent.create({
      data: {
        event_type: PAYMENT_EVENT_TYPE,
        payload: JSON.stringify({ event_type: PAYMENT_EVENT_TYPE, payment_id: rec }),
        status: 'CREATED',
        company_id: companyId,
        crms_booking_id: bookingId,
        crms_customer_id: customerId,
      },
    });
    return { rec, event };
  };

  const postCallback = (body: any, secret?: string) =>
    request(app)
      .post('/api/v1/integration/portal/payment-callback')
      .set('Authorization', `Bearer ${secret || process.env.PORTAL_CRM_SECRET}`)
      .send(body);

  test('6. Inbound callback happy path marks payment SYNCED + records portal reference', async () => {
    const { rec, event } = await createPendingSyncPayment();

    const res = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: rec,
      portal_payment_id: 'PORTAL-PAY-3F-1',
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');

    const payment = await p.payment.findUnique({ where: { id: rec } });
    expect(payment.sync_status).toBe('SYNCED');
    expect(payment.portal_payment_id).toBe('PORTAL-PAY-3F-1');

    // Payment's own financial status is untouched by the Portal
    expect(payment.status).toBe('PENDING');

    const audit = await p.auditEvent.findFirst({
      where: { action: 'PAYMENT_CALLBACK_RECEIVED', entity_id: rec },
    });
    expect(audit).toBeTruthy();
  });

  test('7. Duplicate callback is idempotent (200 duplicate, no second audit)', async () => {
    const { rec, event } = await createPendingSyncPayment();

    const first = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: rec,
    });
    expect(first.status).toBe(200);

    const second = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: rec,
    });
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);

    const audits = await p.auditEvent.count({
      where: { action: 'PAYMENT_CALLBACK_RECEIVED', entity_id: rec },
    });
    expect(audits).toBe(1);
  });

  test('8. Concurrent duplicate callbacks — exactly one winner', async () => {
    const { rec, event } = await createPendingSyncPayment();

    const body = {
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: rec,
    };

    const [r1, r2] = await Promise.all([postCallback(body), postCallback(body)]);
    expect([r1.status, r2.status]).toEqual([200, 200]);

    const payment = await p.payment.findUnique({ where: { id: rec } });
    expect(payment.sync_status).toBe('SYNCED');

    const audits = await p.auditEvent.count({
      where: { action: 'PAYMENT_CALLBACK_RECEIVED', entity_id: rec },
    });
    expect(audits).toBe(1);
  });

  test('9. Callback from another company is rejected (403)', async () => {
    const { rec, event } = await createPendingSyncPayment();
    const otherCompany = await p.company.findFirst({ where: { code: 'TEST_COMP_02' } });

    const res = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: otherCompany.id,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: rec,
    });
    expect(res.status).toBe(403);
  });

  test('10. Callback referencing a wrong customer is rejected (409)', async () => {
    const { rec, event } = await createPendingSyncPayment();

    const res = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: companyId,
      crms_customer_id: 999999,
      crms_booking_id: bookingId,
      payment_id: rec,
    });
    expect(res.status).toBe(409);
  });

  test('11. Callback referencing a wrong booking is rejected (409)', async () => {
    const { rec, event } = await createPendingSyncPayment();

    const res = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: 999999,
      payment_id: rec,
    });
    expect(res.status).toBe(409);
  });

  test('12. Callback referencing an unknown payment is rejected (404)', async () => {
    const { event } = await createPendingSyncPayment();

    const res = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: 999999999,
    });
    expect(res.status).toBe(404);
  });

  test('13. Callback referencing a NON-payment event is rejected (409)', async () => {
    const { rec } = await createPendingSyncPayment();
    const handoffEvent = await p.integrationEvent.create({
      data: {
        event_type: 'BOOKING_PORTAL_HANDOFF',
        payload: JSON.stringify({}),
        status: 'CREATED',
        company_id: companyId,
        crms_booking_id: bookingId,
        crms_customer_id: customerId,
      },
    });

    const res = await postCallback({
      idempotency_key: `crms-evt-${handoffEvent.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'completed',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: rec,
    });
    expect(res.status).toBe(409);
  });

  test('14. Portal cannot claim SUCCESS (verification authority stays in CRM) — 400', async () => {
    const { rec, event } = await createPendingSyncPayment();

    const res = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'SUCCESS',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: rec,
    });
    expect(res.status).toBe(400);
  });

  test('15. failed callback is accepted and audited; payment NOT synced', async () => {
    const { rec, event } = await createPendingSyncPayment();

    const res = await postCallback({
      idempotency_key: `crms-evt-${event.id}`,
      event_type: PAYMENT_EVENT_TYPE,
      status: 'failed',
      company_id: companyId,
      crms_customer_id: customerId,
      crms_booking_id: bookingId,
      payment_id: rec,
      message: 'Portal could not record the payment',
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');

    const payment = await p.payment.findUnique({ where: { id: rec } });
    expect(payment.sync_status).toBe('PENDING_SYNC');

    const audit = await p.auditEvent.findFirst({
      where: { action: 'PAYMENT_CALLBACK_FAILED', entity_id: rec },
    });
    expect(audit).toBeTruthy();
  });

  test('16. Missing/invalid service token rejected (401)', async () => {
    const { rec, event } = await createPendingSyncPayment();

    const noAuth = await postCallback(
      {
        idempotency_key: `crms-evt-${event.id}`,
        event_type: PAYMENT_EVENT_TYPE,
        status: 'completed',
        company_id: companyId,
        crms_customer_id: customerId,
        crms_booking_id: bookingId,
        payment_id: rec,
      },
      'wrong-secret'
    );
    expect(noAuth.status).toBe(401);
  });
});