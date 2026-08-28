import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles, INSTALLMENT_EVENT_TYPE, PAYMENT_EVENT_TYPE } , Roles } from '@rrh-ems/shared';
import { PortalWorker } from '../../apps/api/src/services/portalWorker';

jest.setTimeout(45000);


const p = prisma as any;

describe('Phase 11 Packet 3H - Installment / Financial Status Sync', () => {
  let financeToken: string;
  let company1Id: number;
  let md1UserId: number;
  let company2Id: number;
  let md2UserId: number;
  let md2Token: string;

  // Company 1 fixtures
  let c1CustomerId: number;
  let c1PropertyId: number;
  let c1BookingId: number;
  let c1InstallmentId: number;

  // Negative-path fixture (stays PENDING across tests 4/5/10)
  let negBookingId: number;
  let negInstallmentId: number;
  const createdPaymentIds: number[] = [];

  // Company 2 fixtures
  let c2CustomerId: number;
  let c2PropertyId: number;
  let c2BookingId: number;
  let c2InstallmentId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    process.env.PORTAL_CRM_SECRET = 'test-portal-crm-secret-at-least-32-chars';
    process.env.PORTAL_API_URL = 'http://localhost:9999';
    process.env.CRM_PORTAL_SECRET = 'test-crm-portal-secret-at-least-32-chars';

    await setupDeterministicTestUsers();

    const login = async (code: string, idx: number) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.10.${10 + idx}`)
        .send({ employee_code: code, password: 'Password@123' });
      if (res.status !== 200) {
        throw new Error(`Login failed for ${code}: ${res.text}`);
      }
      return res.body.accessToken;
    };

    const md1Code = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!.employee_code;
    const financeCode = deterministicUsers.find((u) => u.roles[0] === Roles.FINANCE)!.employee_code;
    const md1Token = await login(md1Code, 0);
    financeToken = await login(financeCode, 1);

    const decoded = JSON.parse(Buffer.from(md1Token.split('.')[1], 'base64').toString());
    company1Id = decoded.companyId;
    md1UserId = decoded.employeeId;

    // Company 2 MD for tenant isolation.
    const c2Company = await p.company.findUnique({ where: { code: 'TEST_COMP_02' } });
    company2Id = c2Company.id;
    const md2Code = 'RRH-MDORG-013';
    const hashed = await bcrypt.hash('Password@123', 12);
    const md2 = await p.employee.upsert({
      where: { employee_code: md2Code },
      update: { company_id: company2Id, password_hash: hashed, status: 'ACTIVE' },
      create: {
        employee_code: md2Code,
        full_name: 'Test MD 3H Org2',
        email: 'test-md-3h-org2@example.com',
        phone: '+918888888111',
        password_hash: hashed,
        company_id: company2Id,
        department: 'OPERATIONS',
        status: 'ACTIVE',
      },
    });
    md2UserId = md2.id;
    const mdRole = await p.role.findUnique({ where: { name: Roles.MD } });
    await p.employeeRole.deleteMany({ where: { employee_id: md2.id } });
    await p.employeeRole.create({ data: { employee_id: md2.id, role_id: mdRole.id } });
    md2Token = await login(md2Code, 2);

    // ── Company 1 fixture (booking + installment) ─────────────
    const suffix = Date.now();
    const c1Customer = await p.customer.create({
      data: {
        customer_code: `H-C1-${suffix}`,
        company_id: company1Id,
        first_name: 'Installment',
        last_name: 'Sync One',
        phone: '7777777101',
      },
    });
    c1CustomerId = c1Customer.id;

    const c1Property = await p.property.create({
      data: {
        property_code: `H-C1P-${suffix}`,
        company_id: company1Id,
        title: '3H Company1 Property',
        price: 10000000,
        area_sqft: 1500,
        location: 'Test Loc',
        status: 'LIVE',
        created_by_id: md1UserId,
      },
    });
    c1PropertyId = c1Property.id;

    const c1Booking = await p.booking.create({
      data: {
        booking_code: `H-C1B-${suffix}`,
        company_id: company1Id,
        customer_id: c1CustomerId,
        property_id: c1PropertyId,
        agreed_price: 10000000,
        booking_amount: 1000000,
        balance_amount: 9000000,
        status: 'CONFIRMED',
      },
    });
    c1BookingId = c1Booking.id;

    const c1Installment = await p.installment.create({
      data: {
        booking_id: c1BookingId,
        installment_number: 1,
        expected_amount: 5000000,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        recorded_by_id: md1UserId,
      },
    });
    c1InstallmentId = c1Installment.id;

    // A dedicated PENDING installment for the negative-path tests (4, 5, 10).
    const negBooking = await p.booking.create({
      data: {
        booking_code: `H-C1N-${suffix}`,
        company_id: company1Id,
        customer_id: c1CustomerId,
        property_id: c1PropertyId,
        agreed_price: 10000000,
        booking_amount: 1000000,
        balance_amount: 9000000,
        status: 'CONFIRMED',
      },
    });
    negBookingId = negBooking.id;

    const negInstallment = await p.installment.create({
      data: {
        booking_id: negBookingId,
        installment_number: 1,
        expected_amount: 5000000,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        recorded_by_id: md1UserId,
      },
    });
    negInstallmentId = negInstallment.id;

    // ── Company 2 fixture ─────────────────────────────────────
    const c2Customer = await p.customer.create({
      data: {
        customer_code: `H-C2-${suffix}`,
        company_id: company2Id,
        first_name: 'Installment',
        last_name: 'Sync Two',
        phone: '7777777102',
      },
    });
    c2CustomerId = c2Customer.id;

    const c2Property = await p.property.create({
      data: {
        property_code: `H-C2P-${suffix}`,
        company_id: company2Id,
        title: '3H Company2 Property',
        price: 8000000,
        area_sqft: 1200,
        location: 'Test Loc',
        status: 'LIVE',
        created_by_id: md2UserId,
      },
    });
    c2PropertyId = c2Property.id;

    const c2Booking = await p.booking.create({
      data: {
        booking_code: `H-C2B-${suffix}`,
        company_id: company2Id,
        customer_id: c2CustomerId,
        property_id: c2PropertyId,
        agreed_price: 8000000,
        booking_amount: 800000,
        balance_amount: 7200000,
        status: 'CONFIRMED',
      },
    });
    c2BookingId = c2Booking.id;

    const c2Installment = await p.installment.create({
      data: {
        booking_id: c2BookingId,
        installment_number: 1,
        expected_amount: 4000000,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        recorded_by_id: md2UserId,
      },
    });
    c2InstallmentId = c2Installment.id;
  });

  afterAll(async () => {
    const allBookings = [c1BookingId, c2BookingId, negBookingId].filter(Boolean);
    await p.integrationEvent.deleteMany({
      where: { crms_booking_id: { in: allBookings } },
    });
    await p.customerNotification.deleteMany({
      where: { customer_id: { in: [c1CustomerId, c2CustomerId].filter(Boolean) } },
    });
    await p.payment.deleteMany({
      where: { booking_id: { in: allBookings } },
    });
    await p.installment.deleteMany({
      where: { booking_id: { in: allBookings } },
    });
    await p.booking.deleteMany({ where: { id: { in: allBookings } } });
    await p.property.deleteMany({ where: { id: { in: [c1PropertyId, c2PropertyId].filter(Boolean) } } });
    await p.customer.deleteMany({ where: { id: { in: [c1CustomerId, c2CustomerId].filter(Boolean) } } });
    await p.auditEvent.deleteMany({
      where: {
        entity_id: {
          in: [c1InstallmentId, negInstallmentId, c2InstallmentId, ...createdPaymentIds].filter(Boolean),
        },
        action: { startsWith: 'INSTALLMENT_SYNC' },
      },
    });
    await p.auditEvent.deleteMany({
      where: {
        entity_id: { in: createdPaymentIds.filter(Boolean) },
        action: { startsWith: 'PAYMENT_SYNC' },
      },
    });
    await p.employeeRole.deleteMany({ where: { employee_id: md2UserId } });
    await p.employee.deleteMany({ where: { id: md2UserId } });
    await prisma.$disconnect();
  });

  const mockFetch = (statusCode: number, body: any) => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      status: statusCode,
      json: jest.fn().mockResolvedValue(body),
    });
  };

  const recordPayment = async (
    bookingId: number,
    installmentId: number,
    amount: number,
    token: string,
    reference = 'TXN-3H'
  ): Promise<number> => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ booking_id: bookingId, installment_id: installmentId, amount, payment_method: 'BANK_TRANSFER', reference_number: reference });
    expect(res.status).toBe(201);
    createdPaymentIds.push(res.body.id);
    return res.body.id;
  };

  const verifyPayment = async (paymentId: number, status: string, token: string) => {
    return request(app)
      .put(`/api/v1/payments/${paymentId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status });
  };

  const findInstallmentEvents = async (bookingId: number) =>
    p.integrationEvent.findMany({
      where: { event_type: INSTALLMENT_EVENT_TYPE, crms_booking_id: bookingId },
      orderBy: { id: 'asc' },
    });

  test('1. PENDING → PARTIALLY_RECEIVED emits INSTALLMENT_STATUS_CHANGED with correct payload', async () => {
    const paymentId = await recordPayment(c1BookingId, c1InstallmentId, 2000000, financeToken, 'TXN-3H-1');
    const res = await verifyPayment(paymentId, 'SUCCESS', financeToken);
    expect(res.status).toBe(200);

    const events = await findInstallmentEvents(c1BookingId);
    expect(events.length).toBe(1);

    const payload = JSON.parse(events[0].payload);
    expect(payload.event_type).toBe(INSTALLMENT_EVENT_TYPE);
    expect(payload.company_id).toBe(company1Id);
    expect(payload.crms_customer_id).toBe(c1CustomerId);
    expect(payload.crms_booking_id).toBe(c1BookingId);
    expect(payload.installment_id).toBe(c1InstallmentId);
    expect(payload.installment_number).toBe(1);
    expect(payload.status).toBe('PARTIALLY_RECEIVED');
    expect(payload.expected_amount).toBe(5000000);
    expect(payload.received_amount).toBe(2000000);
    expect(payload.remaining_amount).toBe(3000000);
    expect(payload.changed_at).toBeTruthy();

    // Sensitive-data guard (scoped to JSON keys — bare 'pan' would match "company_id")
    const raw = events[0].payload as string;
    expect(raw.toLowerCase()).not.toContain('"cvv"');
    expect(raw.toLowerCase()).not.toContain('"upi"');
    expect(raw.toLowerCase()).not.toContain('"otp"');
    expect(raw.toLowerCase()).not.toContain('"pan"');
    expect(raw.toLowerCase()).not.toContain('pan_number');
    expect(raw.toLowerCase()).not.toContain('aadhaar');
    expect(raw.toLowerCase()).not.toContain('bank_account');
  });

  test('2. A second partial payment keeps PARTIALLY_RECEIVED and emits NO duplicate event', async () => {
    const paymentId = await recordPayment(c1BookingId, c1InstallmentId, 1000000, financeToken, 'TXN-3H-2');
    const res = await verifyPayment(paymentId, 'SUCCESS', financeToken);
    expect(res.status).toBe(200);

    const events = await findInstallmentEvents(c1BookingId);
    // Only the first transition (PENDING → PARTIALLY_RECEIVED) produced an event.
    expect(events.length).toBe(1);

    const installment = await p.installment.findUnique({ where: { id: c1InstallmentId } });
    expect(installment.received_amount).toBe(3000000);
    expect(installment.status).toBe('PARTIALLY_RECEIVED');
  });

  test('3. PARTIALLY_RECEIVED → RECEIVED emits cleared state with zero remaining', async () => {
    const paymentId = await recordPayment(c1BookingId, c1InstallmentId, 2000000, financeToken, 'TXN-3H-3');
    const res = await verifyPayment(paymentId, 'SUCCESS', financeToken);
    expect(res.status).toBe(200);

    const events = await findInstallmentEvents(c1BookingId);
    expect(events.length).toBe(2); // 1st transition + this one

    const payload = JSON.parse(events[1].payload);
    expect(payload.status).toBe('RECEIVED');
    expect(payload.received_amount).toBe(5000000);
    expect(payload.remaining_amount).toBe(0);
    expect(payload.expected_amount).toBe(5000000);
  });

  test('4. FAILED verify does NOT emit an installment event and does not change installment state', async () => {
    const paymentId = await recordPayment(negBookingId, negInstallmentId, 100000, financeToken, 'TXN-3H-4');
    const res = await verifyPayment(paymentId, 'FAILED', financeToken);
    expect(res.status).toBe(200);

    const events = await findInstallmentEvents(negBookingId);
    expect(events.length).toBe(0);

    const installment = await p.installment.findUnique({ where: { id: negInstallmentId } });
    expect(installment.received_amount).toBe(0);
    expect(installment.status).toBe('PENDING');
  });

  test('5. Duplicate verifyPayment (already SUCCESS) cannot emit a second event', async () => {
    const paymentId = await recordPayment(negBookingId, negInstallmentId, 500000, financeToken, 'TXN-3H-5');
    const first = await verifyPayment(paymentId, 'SUCCESS', financeToken);
    expect(first.status).toBe(200);

    const afterFirst = await findInstallmentEvents(negBookingId);
    // First SUCCESS verification produced exactly one event (PENDING → PARTIALLY_RECEIVED).
    expect(afterFirst.length).toBe(1);

    const duplicate = await verifyPayment(paymentId, 'SUCCESS', financeToken);
    expect(duplicate.status).toBe(400);
    const final = await findInstallmentEvents(negBookingId);
    expect(final.length).toBe(1);
  });

  test('6. Worker delivers INSTALLMENT_STATUS_CHANGED to /installment-status and completes it', async () => {
    const events = await findInstallmentEvents(c1BookingId);
    const event = events[0];

    mockFetch(200, { status: 'accepted' });
    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const after = await p.integrationEvent.findUnique({ where: { id: event.id } });
    expect(after.status).toBe('COMPLETED');
    expect(after.processed_at).toBeTruthy();

    const completedAudit = await p.auditEvent.findFirst({
      where: { action: 'INSTALLMENT_SYNC_COMPLETED', entity_id: c1InstallmentId },
    });
    expect(completedAudit).toBeTruthy();
  });

  test('7. Worker retries on 5xx then goes terminal FAILED after max_retries', async () => {
    // Drain the queue first — processNextEvent picks the OLDEST CREATED event,
    // and earlier tests (1-3) left installment + payment events in CREATED state.
    mockFetch(200, { status: 'accepted' });
    while (await PortalWorker.processNextEvent()) {
      // drain
    }

    const payload = {
      event_type: INSTALLMENT_EVENT_TYPE,
      company_id: company1Id,
      crms_customer_id: c1CustomerId,
      crms_booking_id: c1BookingId,
      installment_id: c1InstallmentId,
      installment_number: 1,
      status: 'RECEIVED',
      expected_amount: 5000000,
      received_amount: 5000000,
      remaining_amount: 0,
      changed_at: new Date().toISOString(),
    };
    const event = await p.integrationEvent.create({
      data: {
        event_type: INSTALLMENT_EVENT_TYPE,
        payload: JSON.stringify(payload),
        status: 'CREATED',
        company_id: company1Id,
        crms_booking_id: c1BookingId,
        crms_customer_id: c1CustomerId,
        max_retries: 2,
      },
    });

    mockFetch(500, { status: 'error' });
    await PortalWorker.processNextEvent();
    let current = await p.integrationEvent.findUnique({ where: { id: event.id } });
    expect(current.status).toBe('CREATED');
    expect(current.retry_count).toBe(1);

    mockFetch(500, { status: 'error' });
    await PortalWorker.processNextEvent();
    current = await p.integrationEvent.findUnique({ where: { id: event.id } });
    expect(current.status).toBe('FAILED');
    expect(current.retry_count).toBe(2);

    const terminalAudit = await p.auditEvent.findFirst({
      where: { action: 'INSTALLMENT_SYNC_TERMINAL_FAILURE', entity_id: c1InstallmentId },
    });
    expect(terminalAudit).toBeTruthy();

    await p.integrationEvent.delete({ where: { id: event.id } });
    await p.auditEvent.deleteMany({ where: { entity_id: c1InstallmentId, action: { in: ['INSTALLMENT_SYNC_INITIATED', 'INSTALLMENT_SYNC_FAILED', 'INSTALLMENT_SYNC_TERMINAL_FAILURE'] } } });
  });

  test('8. Tenant isolation — Company-1 installment event never references Company-2 data', async () => {
    const events = await findInstallmentEvents(c1BookingId);
    for (const e of events) {
      expect(e.company_id).toBe(company1Id);
      expect(e.crms_booking_id).toBe(c1BookingId);
      expect(e.crms_customer_id).toBe(c1CustomerId);
      const payload = JSON.parse(e.payload);
      expect(payload.company_id).toBe(company1Id);
      expect(payload.crms_booking_id).toBe(c1BookingId);
      expect(payload.installment_id).toBe(c1InstallmentId);
    }
  });

  test('9. Company-2 collection is isolated — no Company-2 event leaks into Company-1 query and vice versa', async () => {
    // Verify a Company-2 installment fully in one go (PENDING → RECEIVED).
    const paymentId = await recordPayment(c2BookingId, c2InstallmentId, 4000000, md2Token, 'TXN-3H-C2-1');
    const res = await verifyPayment(paymentId, 'SUCCESS', md2Token);
    expect(res.status).toBe(200);

    const c1Events = await findInstallmentEvents(c1BookingId);
    const c2Events = await findInstallmentEvents(c2BookingId);

    // Company-2 produced exactly its own event.
    expect(c2Events.length).toBe(1);
    expect(c2Events[0].company_id).toBe(company2Id);
    const c2Payload = JSON.parse(c2Events[0].payload);
    expect(c2Payload.status).toBe('RECEIVED');
    expect(c2Payload.remaining_amount).toBe(0);

    // Company-1 query is unaffected by the Company-2 collection.
    for (const e of c1Events) {
      expect(e.company_id).toBe(company1Id);
      expect(e.crms_booking_id).toBe(c1BookingId);
    }
  });

  test('10. No event when a payment is recorded but NOT verified (no state change)', async () => {
    const before = await findInstallmentEvents(negBookingId);
    await recordPayment(negBookingId, negInstallmentId, 100000, financeToken, 'TXN-3H-NV');
    const after = await findInstallmentEvents(negBookingId);
    expect(after.length).toBe(before.length);
  });

  test('11. 3F PAYMENT_STATUS_CHANGED is still emitted alongside the installment event (no regression)', async () => {
    const payEvents = await p.integrationEvent.findMany({
      where: { event_type: PAYMENT_EVENT_TYPE, crms_booking_id: c2BookingId },
      orderBy: { id: 'asc' },
    });
    // The Company-2 SUCCESS verification (test 9) must also have produced a 3F payment event.
    expect(payEvents.length).toBeGreaterThanOrEqual(1);
    expect(payEvents[0].company_id).toBe(company2Id);
  });
});
