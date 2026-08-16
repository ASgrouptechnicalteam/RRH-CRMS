import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles, PAYMENT_EVENT_TYPE } from '@rrh-ems/shared';
import { getISTComponents } from '../../apps/api/src/utils/time';

jest.setTimeout(45000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 11 Packet 3G - Portal / Integration Metrics', () => {
  let md1Token: string;
  let md2Token: string;
  let adminToken: string;
  let telecallerToken: string;
  let company1Id: number;
  let company2Id: number;
  let md1UserId: number;
  let md2UserId: number;

  // Company 1 fixtures
  let c1CustomerId: number;
  let c1PropertyId: number;
  let c1BookingId: number;
  const c1PaymentIds: number[] = [];
  const c1EventIds: number[] = [];
  const c1MappingIds: number[] = [];
  const c1NotificationIds: number[] = [];

  // Company 2 fixtures
  let c2CustomerId: number;
  let c2PropertyId: number;
  let c2BookingId: number;
  const c2PaymentIds: number[] = [];
  const c2EventIds: number[] = [];
  const c2MappingIds: number[] = [];
  const c2NotificationIds: number[] = [];

  // Pre-seed endpoint baselines (DB is shared/persistent across suites — assert
  // exact deltas produced by this suite's seeds).
  let base1: any;
  let base2: any;
  let baseToday1: any;

  const PAN_SENTINEL = 'ABCDE1234F';

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
        .set('X-Forwarded-For', `192.168.9.${10 + idx}`)
        .send({ employee_code: code, password: 'Password@123' });
      if (res.status !== 200) {
        throw new Error(`Login failed for ${code}: ${res.text}`);
      }
      return res.body.accessToken;
    };

    const md1Code = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!.employee_code;
    const adminCode = deterministicUsers.find((u) => u.roles[0] === Roles.ADMIN)!.employee_code;
    const telecallerCode = deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!.employee_code;

    md1Token = await login(md1Code, 0);
    adminToken = await login(adminCode, 1);
    telecallerToken = await login(telecallerCode, 2);

    const decoded = JSON.parse(Buffer.from(md1Token.split('.')[1], 'base64').toString());
    company1Id = decoded.companyId;
    md1UserId = decoded.employeeId;

    // Company 2 (cross-org). Build an MD for tenant-isolation testing.
    const c2Company = await p.company.findUnique({ where: { code: 'TEST_COMP_02' } });
    company2Id = c2Company.id;
    const md2Code = 'RRH-MDORG-001';
    const hashed = await bcrypt.hash('Password@123', 12);
    const md2 = await p.employee.upsert({
      where: { employee_code: md2Code },
      update: { company_id: company2Id, password_hash: hashed, status: 'ACTIVE' },
      create: {
        employee_code: md2Code,
        full_name: 'Test MD Org2',
        email: 'test-md-org2@example.com',
        phone: '+918888888099',
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
    md2Token = await login(md2Code, 3);

    // Capture pre-seed endpoint baselines for delta assertions.
    const getMetricsBody = async (token: string, query: string = '') => {
      const r = await request(app)
        .get(`/api/v1/integration/metrics${query}`)
        .set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(200);
      return r.body;
    };
    base1 = await getMetricsBody(md1Token);
    base2 = await getMetricsBody(md2Token);

    // ── Seed Company 1 portal data ────────────────────────────
    const suffix = Date.now();
    const c1Customer = await p.customer.create({
      data: {
        customer_code: `G-C1-${suffix}`,
        company_id: company1Id,
        first_name: 'Metrics',
        last_name: 'One',
        phone: '7777777001',
        pan_number: PAN_SENTINEL,
        aadhaar_number: '123456789001',
      },
    });
    c1CustomerId = c1Customer.id;

    const c1Property = await p.property.create({
      data: {
        property_code: `G-C1P-${suffix}`,
        company_id: company1Id,
        title: 'Metrics Company1 Property',
        price: 5000000,
        area_sqft: 1200,
        location: 'Test Loc',
        status: 'LIVE',
        created_by_id: md1UserId,
      },
    });
    c1PropertyId = c1Property.id;

    const c1Booking = await p.booking.create({
      data: {
        booking_code: `G-C1B-${suffix}`,
        company_id: company1Id,
        customer_id: c1CustomerId,
        property_id: c1PropertyId,
        agreed_price: 5000000,
        booking_amount: 100000,
        balance_amount: 4900000,
        status: 'CONFIRMED',
      },
    });
    c1BookingId = c1Booking.id;

    const c1Payments = await Promise.all([
      p.payment.create({
        data: {
          payment_code: `G-C1PAY-${suffix}-1`,
          company_id: company1Id,
          booking_id: c1BookingId,
          amount: 100000,
          payment_method: 'BANK_TRANSFER',
          status: 'SUCCESS',
          sync_status: 'SYNCED',
          source: 'CRM',
          portal_payment_id: 'PORTAL-PAY-1',
          recorded_by_id: md1UserId,
        },
      }),
      p.payment.create({
        data: {
          payment_code: `G-C1PAY-${suffix}-2`,
          company_id: company1Id,
          booking_id: c1BookingId,
          amount: 50000,
          payment_method: 'CASH',
          status: 'SUCCESS',
          sync_status: 'PENDING_SYNC',
          source: 'CRM',
          recorded_by_id: md1UserId,
        },
      }),
      p.payment.create({
        data: {
          payment_code: `G-C1PAY-${suffix}-3`,
          company_id: company1Id,
          booking_id: c1BookingId,
          amount: 25000,
          payment_method: 'ONLINE',
          status: 'PENDING',
          sync_status: 'LOCAL',
          source: 'PORTAL',
          recorded_by_id: md1UserId,
        },
      }),
    ]);
    c1PaymentIds.push(...c1Payments.map((x) => x.id));

    const c1Events = await Promise.all([
      p.integrationEvent.create({
        data: {
          event_type: 'BOOKING_PORTAL_HANDOFF',
          payload: JSON.stringify({ event_type: 'BOOKING_PORTAL_HANDOFF', company_id: company1Id, crms_booking_id: c1BookingId }),
          status: 'COMPLETED',
          company_id: company1Id,
          crms_booking_id: c1BookingId,
          retry_count: 1,
        },
      }),
      p.integrationEvent.create({
        data: {
          event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
          payload: JSON.stringify({ event_type: 'CUSTOMER_KYC_STATUS_CHANGED', company_id: company1Id, crms_customer_id: c1CustomerId }),
          status: 'CREATED',
          company_id: company1Id,
          crms_customer_id: c1CustomerId,
        },
      }),
      p.integrationEvent.create({
        data: {
          event_type: PAYMENT_EVENT_TYPE,
          payload: JSON.stringify({ event_type: PAYMENT_EVENT_TYPE, company_id: company1Id, payment_id: c1Payments[0].id }),
          status: 'FAILED',
          company_id: company1Id,
          crms_booking_id: c1BookingId,
          crms_customer_id: c1CustomerId,
          retry_count: 3,
          error_message: 'max retries exceeded',
        },
      }),
      p.integrationEvent.create({
        data: {
          event_type: PAYMENT_EVENT_TYPE,
          payload: JSON.stringify({ event_type: PAYMENT_EVENT_TYPE, company_id: company1Id, payment_id: c1Payments[1].id }),
          status: 'PROCESSING',
          company_id: company1Id,
          crms_booking_id: c1BookingId,
          crms_customer_id: c1CustomerId,
          retry_count: 2,
        },
      }),
    ]);
    c1EventIds.push(...c1Events.map((x) => x.id));

    const c1Mappings = await Promise.all([
      p.bookingPortalMapping.create({
        data: { company_id: company1Id, crms_booking_id: c1BookingId, crms_customer_id: c1CustomerId, handoff_status: 'ACTIVE' },
      }),
      p.bookingPortalMapping.create({
        data: { company_id: company1Id, crms_booking_id: c1BookingId + 100000, crms_customer_id: c1CustomerId, handoff_status: 'WAITING_ACTIVATION' },
      }),
      p.bookingPortalMapping.create({
        data: { company_id: company1Id, crms_booking_id: c1BookingId + 200000, crms_customer_id: c1CustomerId, handoff_status: 'FAILED' },
      }),
    ]);
    c1MappingIds.push(...c1Mappings.map((x) => x.id));

    const c1Notifications = await Promise.all([
      p.customerNotification.create({
        data: { company_id: company1Id, customer_id: c1CustomerId, booking_id: c1BookingId, type: 'PORTAL_ACTIVATED', title: 'Activated', message: 'm' },
      }),
      p.customerNotification.create({
        data: { company_id: company1Id, customer_id: c1CustomerId, booking_id: c1BookingId, type: 'KYC_STATUS_UPDATED', title: 'KYC', message: 'm' },
      }),
      p.customerNotification.create({
        data: { company_id: company1Id, customer_id: c1CustomerId, booking_id: c1BookingId, type: 'PAYMENT_STATUS_UPDATED', title: 'Payment', message: 'm' },
      }),
    ]);
    c1NotificationIds.push(...c1Notifications.map((x) => x.id));

    // ── Seed Company 2 portal data ────────────────────────────
    const c2Customer = await p.customer.create({
      data: {
        customer_code: `G-C2-${suffix}`,
        company_id: company2Id,
        first_name: 'Metrics',
        last_name: 'Two',
        phone: '7777777002',
        pan_number: 'XYZDE1234F',
      },
    });
    c2CustomerId = c2Customer.id;

    const c2Property = await p.property.create({
      data: {
        property_code: `G-C2P-${suffix}`,
        company_id: company2Id,
        title: 'Metrics Company2 Property',
        price: 4000000,
        area_sqft: 1000,
        location: 'Test Loc',
        status: 'LIVE',
        created_by_id: md2UserId,
      },
    });
    c2PropertyId = c2Property.id;

    const c2Booking = await p.booking.create({
      data: {
        booking_code: `G-C2B-${suffix}`,
        company_id: company2Id,
        customer_id: c2CustomerId,
        property_id: c2PropertyId,
        agreed_price: 4000000,
        booking_amount: 80000,
        balance_amount: 3920000,
        status: 'CONFIRMED',
      },
    });
    c2BookingId = c2Booking.id;

    const c2Payment = await p.payment.create({
      data: {
        payment_code: `G-C2PAY-${suffix}-1`,
        company_id: company2Id,
        booking_id: c2BookingId,
        amount: 80000,
        payment_method: 'CASH',
        status: 'SUCCESS',
        sync_status: 'SYNCED',
        source: 'CRM',
        portal_payment_id: 'PORTAL-PAY-2',
        recorded_by_id: md2UserId,
      },
    });
    c2PaymentIds.push(c2Payment.id);

    const c2Event = await p.integrationEvent.create({
      data: {
        event_type: PAYMENT_EVENT_TYPE,
        payload: JSON.stringify({ event_type: PAYMENT_EVENT_TYPE, company_id: company2Id, payment_id: c2Payment.id }),
        status: 'COMPLETED',
        company_id: company2Id,
        crms_booking_id: c2BookingId,
        crms_customer_id: c2CustomerId,
        retry_count: 0,
      },
    });
    c2EventIds.push(c2Event.id);

    const c2Mapping = await p.bookingPortalMapping.create({
      data: { company_id: company2Id, crms_booking_id: c2BookingId, crms_customer_id: c2CustomerId, handoff_status: 'WAITING_ACTIVATION' },
    });
    c2MappingIds.push(c2Mapping.id);

    const c2Notification = await p.customerNotification.create({
      data: { company_id: company2Id, customer_id: c2CustomerId, booking_id: c2BookingId, type: 'PORTAL_ACTIVATED', title: 'Activated', message: 'm' },
    });
    c2NotificationIds.push(c2Notification.id);
  });

  afterAll(async () => {
    await p.customerNotification.deleteMany({ where: { id: { in: [...c1NotificationIds, ...c2NotificationIds].filter(Boolean) } } });
    await p.integrationEvent.deleteMany({ where: { id: { in: [...c1EventIds, ...c2EventIds].filter(Boolean) } } });
    await p.bookingPortalMapping.deleteMany({ where: { id: { in: [...c1MappingIds, ...c2MappingIds].filter(Boolean) } } });
    await p.payment.deleteMany({ where: { id: { in: [...c1PaymentIds, ...c2PaymentIds].filter(Boolean) } } });
    await p.booking.deleteMany({ where: { id: { in: [c1BookingId, c2BookingId].filter(Boolean) } } });
    await p.property.deleteMany({ where: { id: { in: [c1PropertyId, c2PropertyId].filter(Boolean) } } });
    await p.customer.deleteMany({ where: { id: { in: [c1CustomerId, c2CustomerId].filter(Boolean) } } });
    await p.employeeRole.deleteMany({ where: { employee_id: md2UserId } });
    await p.employee.deleteMany({ where: { id: md2UserId } });
    await prisma.$disconnect();
  });

  const getMetrics = (token: string, query: string = '') =>
    request(app)
      .get(`/api/v1/integration/metrics${query}`)
      .set('Authorization', `Bearer ${token}`);

  test('1. Requires an authenticated user (401 without token)', async () => {
    const res = await request(app).get('/api/v1/integration/metrics');
    expect(res.status).toBe(401);
  });

  test('2. Denies users without ADMIN_SYSTEM_METRICS (403)', async () => {
    const res = await getMetrics(telecallerToken);
    expect(res.status).toBe(403);
  });

  test('3. Rejects the Portal service token (must be user JWT)', async () => {
    const res = await request(app)
      .get('/api/v1/integration/metrics')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`);
    expect(res.status).toBe(401);
  });

  test('4. MD can access and sees correct Company-1 snapshot', async () => {
    const res = await getMetrics(md1Token);
    expect(res.status).toBe(200);

    const body = res.body;
    expect(body.company_id).toBe(company1Id);
    expect(body.range).toEqual({ from: null, to: null });

    // Handoffs: +3 (ACTIVE, WAITING_ACTIVATION, FAILED) over pre-seed baseline
    expect(body.handoffs.total).toBe(base1.handoffs.total + 3);
    expect(body.handoffs.byStatus.ACTIVE).toBe(base1.handoffs.byStatus.ACTIVE + 1);
    expect(body.handoffs.byStatus.WAITING_ACTIVATION).toBe(base1.handoffs.byStatus.WAITING_ACTIVATION + 1);
    expect(body.handoffs.byStatus.FAILED).toBe(base1.handoffs.byStatus.FAILED + 1);
    expect(body.handoffs.byStatus.CREATED).toBe(base1.handoffs.byStatus.CREATED + 0);

    // Outbox: +4 events over baseline
    expect(body.outbox.total).toBe(base1.outbox.total + 4);
    expect(body.outbox.byEventType.BOOKING_PORTAL_HANDOFF).toBe(base1.outbox.byEventType.BOOKING_PORTAL_HANDOFF + 1);
    expect(body.outbox.byEventType.CUSTOMER_KYC_STATUS_CHANGED).toBe(base1.outbox.byEventType.CUSTOMER_KYC_STATUS_CHANGED + 1);
    expect(body.outbox.byEventType.PAYMENT_STATUS_CHANGED).toBe(base1.outbox.byEventType.PAYMENT_STATUS_CHANGED + 2);
    expect(body.outbox.byStatus.COMPLETED).toBe(base1.outbox.byStatus.COMPLETED + 1);
    expect(body.outbox.byStatus.CREATED).toBe(base1.outbox.byStatus.CREATED + 1);
    expect(body.outbox.byStatus.FAILED).toBe(base1.outbox.byStatus.FAILED + 1);
    expect(body.outbox.byStatus.PROCESSING).toBe(base1.outbox.byStatus.PROCESSING + 1);
    expect(body.outbox.retried).toBe(base1.outbox.retried + 3); // retry_count > 0
    expect(body.outbox.terminalFailures).toBe(base1.outbox.terminalFailures + 1); // status FAILED

    // Payments: +3 (SYNCED, PENDING_SYNC, LOCAL / 2 CRM, 1 PORTAL)
    expect(body.payments.total).toBe(base1.payments.total + 3);
    expect(body.payments.bySyncStatus.SYNCED).toBe(base1.payments.bySyncStatus.SYNCED + 1);
    expect(body.payments.bySyncStatus.PENDING_SYNC).toBe(base1.payments.bySyncStatus.PENDING_SYNC + 1);
    expect(body.payments.bySyncStatus.LOCAL).toBe(base1.payments.bySyncStatus.LOCAL + 1);
    expect(body.payments.bySource.CRM).toBe(base1.payments.bySource.CRM + 2);
    expect(body.payments.bySource.PORTAL).toBe(base1.payments.bySource.PORTAL + 1);

    // KYC: +1 customer with no kyc_status → UNKNOWN bucket
    expect(body.kyc.total).toBe(base1.kyc.total + 1);
    expect(body.kyc.byStatus.UNKNOWN).toBe(base1.kyc.byStatus.UNKNOWN + 1);
    expect(body.kyc.byStatus.VERIFIED).toBe(base1.kyc.byStatus.VERIFIED + 0);
    expect(body.kyc.submissions).toBe(base1.kyc.submissions + 0);

    // Notifications: +3 (one of each type)
    expect(body.notifications.total).toBe(base1.notifications.total + 3);
    expect(body.notifications.byType.PORTAL_ACTIVATED).toBe(base1.notifications.byType.PORTAL_ACTIVATED + 1);
    expect(body.notifications.byType.KYC_STATUS_UPDATED).toBe(base1.notifications.byType.KYC_STATUS_UPDATED + 1);
    expect(body.notifications.byType.PAYMENT_STATUS_UPDATED).toBe(base1.notifications.byType.PAYMENT_STATUS_UPDATED + 1);
  });

  test('5. Tenant isolation — Company-1 MD never sees Company-2 data', async () => {
    const res = await getMetrics(md1Token);
    expect(res.status).toBe(200);
    const body = res.body;

    // Company-1 counts must only reflect Company-1 baseline + Company-1 seeds
    expect(body.handoffs.total).toBe(base1.handoffs.total + 3); // company 2 mapping excluded
    expect(body.outbox.total).toBe(base1.outbox.total + 4); // company 2 event excluded
    expect(body.payments.total).toBe(base1.payments.total + 3); // company 2 payment excluded
    expect(body.kyc.total).toBe(base1.kyc.total + 1); // company 2 customer excluded
    expect(body.notifications.total).toBe(base1.notifications.total + 3); // company 2 notification excluded
  });

  test('6. Tenant isolation — Company-2 MD sees only Company-2 data', async () => {
    const res = await getMetrics(md2Token);
    expect(res.status).toBe(200);
    const body = res.body;

    expect(body.company_id).toBe(company2Id);
    // Company-2 baseline + exactly the Company-2 seeds, never Company-1 rows
    expect(body.handoffs.total).toBe(base2.handoffs.total + 1);
    expect(body.handoffs.byStatus.WAITING_ACTIVATION).toBe(base2.handoffs.byStatus.WAITING_ACTIVATION + 1);
    expect(body.handoffs.byStatus.ACTIVE).toBe(base2.handoffs.byStatus.ACTIVE + 0);
    expect(body.outbox.total).toBe(base2.outbox.total + 1);
    expect(body.outbox.byEventType.PAYMENT_STATUS_CHANGED).toBe(base2.outbox.byEventType.PAYMENT_STATUS_CHANGED + 1);
    expect(body.outbox.byStatus.COMPLETED).toBe(base2.outbox.byStatus.COMPLETED + 1);
    expect(body.outbox.retried).toBe(base2.outbox.retried + 0);
    expect(body.outbox.terminalFailures).toBe(base2.outbox.terminalFailures + 0);
    expect(body.payments.total).toBe(base2.payments.total + 1);
    expect(body.payments.bySyncStatus.SYNCED).toBe(base2.payments.bySyncStatus.SYNCED + 1);
    expect(body.payments.bySource.CRM).toBe(base2.payments.bySource.CRM + 1);
    expect(body.kyc.total).toBe(base2.kyc.total + 1);
    expect(body.kyc.byStatus.UNKNOWN).toBe(base2.kyc.byStatus.UNKNOWN + 1);
    expect(body.notifications.total).toBe(base2.notifications.total + 1);
    expect(body.notifications.byType.PORTAL_ACTIVATED).toBe(base2.notifications.byType.PORTAL_ACTIVATED + 1);
  });

  test('7. Admin (Technical) can access the endpoint', async () => {
    const res = await getMetrics(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.company_id).toBe(company1Id);
    expect(res.body.outbox.total).toBe(base1.outbox.total + 4);
  });

  test('8. Rejects invalid date formats (400)', async () => {
    const res = await getMetrics(md1Token, '?from=14-08-2026');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid query parameters');
  });

  test('9. Rejects from > to (400)', async () => {
    const res = await getMetrics(md1Token, '?from=2026-08-15&to=2026-08-14');
    expect(res.status).toBe(400);
  });

  test('10. includeTimeseries=true requires from/to (400)', async () => {
    const res = await getMetrics(md1Token, '?includeTimeseries=true');
    expect(res.status).toBe(400);
  });

  test('11. IST date filtering narrows the snapshot to the range', async () => {
    const today = getISTComponents(new Date()).dateString;
    const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Baseline for the "today" range BEFORE seeding the old event.
    const todayBase = await getMetrics(md1Token, `?from=${today}&to=${today}`);
    expect(todayBase.status).toBe(200);

    // Seed a Company-1 event that is guaranteed outside today's IST range.
    const oldEvent = await p.integrationEvent.create({
      data: {
        event_type: 'BOOKING_PORTAL_HANDOFF',
        payload: JSON.stringify({ event_type: 'BOOKING_PORTAL_HANDOFF', company_id: company1Id, crms_booking_id: c1BookingId }),
        status: 'COMPLETED',
        company_id: company1Id,
        crms_booking_id: c1BookingId,
        created_at: new Date(yesterdayIso),
      },
    });

    try {
      const full = await getMetrics(md1Token);
      expect(full.status).toBe(200);
      // Full snapshot includes the old event: baseline + 4 seeded + 1 old.
      expect(full.body.outbox.total).toBe(base1.outbox.total + 5);

      const todayOnly = await getMetrics(md1Token, `?from=${today}&to=${today}`);
      expect(todayOnly.status).toBe(200);
      // Old event excluded; today's range must be identical to the today-baseline
      // (which already includes the today-seeded events).
      expect(todayOnly.body.outbox.total).toBe(todayBase.body.outbox.total);
      expect(todayOnly.body.range).toEqual({ from: today, to: today });
    } finally {
      await p.integrationEvent.deleteMany({ where: { id: oldEvent.id } });
    }
  });

  test('12. Time-series returns daily IST buckets within range', async () => {
    const today = getISTComponents(new Date()).dateString;
    const res = await getMetrics(md1Token, `?from=${today}&to=${today}&includeTimeseries=true`);
    expect(res.status).toBe(200);

    const days = res.body.timeseries.days;
    expect(Array.isArray(days)).toBe(true);
    const todayBucket = days.find((d: any) => d.date === today);
    expect(todayBucket).toBeDefined();
    // All today's seeded events were created in IST today.
    expect(todayBucket.outbox.COMPLETED).toBeGreaterThanOrEqual(1);
    expect(todayBucket.handoffs.ACTIVE).toBeGreaterThanOrEqual(1);
    expect(todayBucket.payments.SYNCED).toBeGreaterThanOrEqual(1);
    expect(todayBucket.notifications.PORTAL_ACTIVATED).toBeGreaterThanOrEqual(1);
  });

  test('13. Response never exposes raw payloads or sensitive KYC data', async () => {
    const res = await getMetrics(md1Token);
    expect(res.status).toBe(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('"payload"');
    expect(raw).not.toContain(PAN_SENTINEL);
    expect(raw).not.toContain('aadhaar');
    expect(raw).not.toContain('bank_account');
  });
});
