import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 11 Packet 3D - Portal KYC Submission Callback', () => {
  let mdToken: string;
  let companyId: number;
  let customerId: number;
  let eventId: number;
  let crossOrgCompanyId: number;
  let crossOrgCustomerId: number;
  let unknownCustomerEventId: number;
  let handoffEventId: number;
  let freshCustomerId: number;
  let freshEventId: number;
  let sensitiveCustomerId: number;
  let sensitiveEventId: number;
  let failureCustomerId: number;
  let failureEventId: number;
  let concurrentCustomerId: number;
  let concurrentEventId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    process.env.PORTAL_CRM_SECRET = 'test-portal-crm-secret-at-least-32-chars';

    await setupDeterministicTestUsers();

    const getAuth = async (code: string, idx: number = 0) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.3.${10 + idx}`)
        .send({
          employee_code: code,
          password: 'Password@123',
        });
      if (res.status !== 200) {
        throw new Error(`Login failed for ${code}: ${res.text}`);
      }
      return res.body.accessToken;
    };

    const { deterministicUsers } = await import('../fixtures/testUsers');
    const mdCode = deterministicUsers.find(u => u.roles[0] === Roles.MD)!.employee_code;
    mdToken = await getAuth(mdCode, 0);
    const decoded = JSON.parse(Buffer.from(mdToken.split('.')[1], 'base64').toString());
    companyId = decoded.companyId;

    const crossCompany = await p.company.findFirst({ where: { code: 'TEST_COMP_02' } });
    crossOrgCompanyId = crossCompany.id;
    crossOrgCustomerId = (await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3D-X-${Date.now()}`,
        first_name: 'Cross',
        last_name: 'KycCb',
        phone: '7777777777',
        company_id: crossOrgCompanyId,
      },
    })).id;

    const customer = await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3D-${Date.now()}`,
        first_name: 'Kyc',
        last_name: 'Callback',
        phone: '6666666666',
        company_id: companyId,
      },
    });
    customerId = customer.id;

    // Simulates the Packet 3C outbound event the callback references via crms-evt-{id}.
    // Payload mirrors the 3C contract — status + masked_pan only, never raw KYC.
    const event = await p.integrationEvent.create({
      data: {
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        payload: JSON.stringify({
          event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
          company_id: companyId,
          crms_customer_id: customerId,
          crms_booking_id: null,
          kyc_status: 'PENDING',
          masked_pan: null,
          verified_at: null,
        }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: customerId,
        crms_booking_id: null,
      },
    });
    eventId = event.id;

    // Event referencing a customer that does not exist (for the 404 path).
    const unknownEvent = await p.integrationEvent.create({
      data: {
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        payload: JSON.stringify({ kyc_status: 'PENDING' }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: 99999999,
        crms_booking_id: null,
      },
    });
    unknownCustomerEventId = unknownEvent.id;

    // A NON-KYC event (3B booking handoff) referencing the same customer — used to
    // prove the callback validates the PERSISTED event_type, not just the DTO's.
    const handoffEvent = await p.integrationEvent.create({
      data: {
        event_type: 'BOOKING_PORTAL_HANDOFF',
        payload: JSON.stringify({ booking_id: null }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: customerId,
        crms_booking_id: null,
      },
    });
    handoffEventId = handoffEvent.id;
  });

  afterAll(async () => {
    const eventIds = [
      eventId,
      unknownCustomerEventId,
      handoffEventId,
      freshEventId,
      sensitiveEventId,
      failureEventId,
      concurrentEventId,
    ].filter(Boolean);
    await p.integrationEvent.deleteMany({ where: { id: { in: eventIds } } });
    const customerIds = [
      customerId,
      crossOrgCustomerId,
      freshCustomerId,
      sensitiveCustomerId,
      failureCustomerId,
      concurrentCustomerId,
    ].filter(Boolean);
    await p.auditEvent.deleteMany({
      where: {
        action: { in: ['KYC_CALLBACK_SUBMITTED', 'KYC_CALLBACK_REJECTED'] },
        entity_id: { in: customerIds },
      },
    });
    await p.customer.deleteMany({ where: { id: { in: customerIds } } });
  });

  const kycCallbackBody = (overrides: Record<string, any> = {}) => ({
    idempotency_key: `crms-evt-${eventId}`,
    event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
    status: 'submitted',
    portal_customer_id: 'PORTAL-CUST-K1',
    company_id: companyId,
    crms_customer_id: customerId,
    ...overrides,
  });

  const postCallback = async (body: any, token?: string) => {
    const req = request(app).post('/api/v1/integration/portal/kyc-callback');
    if (token !== undefined) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req.send(body);
  };

  test('1. Valid submitted callback returns 200, persists SUBMITTED state, audits with actor 0', async () => {
    const res = await postCallback(kycCallbackBody(), process.env.PORTAL_CRM_SECRET);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');

    const customer = await p.customer.findUnique({ where: { id: customerId } });
    expect(customer.kyc_submission_status).toBe('SUBMITTED');
    expect(customer.kyc_submitted_at).toBeTruthy();

    const audit = await p.auditEvent.findFirst({
      where: { action: 'KYC_CALLBACK_SUBMITTED', entity_id: customerId },
      orderBy: { created_at: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.actor_id).toBe(0);
    expect(audit.entity_type).toBe('Customer');
    expect(audit.old_value).toBe('NONE');
    expect(audit.new_value).toBe('SUBMITTED');
  });

  test('2. Duplicate callback returns 200 duplicate=true without re-write or duplicate audit', async () => {
    const before = await p.customer.findUnique({ where: { id: customerId } });
    const submittedAtBefore = before.kyc_submitted_at;

    const res = await postCallback(kycCallbackBody(), process.env.PORTAL_CRM_SECRET);
    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);

    const customer = await p.customer.findUnique({ where: { id: customerId } });
    expect(customer.kyc_submission_status).toBe('SUBMITTED');
    expect(customer.kyc_submitted_at).toEqual(submittedAtBefore);

    const auditCount = await p.auditEvent.count({
      where: { action: 'KYC_CALLBACK_SUBMITTED', entity_id: customerId },
    });
    expect(auditCount).toBe(1);
  });

  test('3. Invalid service token returns 401', async () => {
    const res = await postCallback(kycCallbackBody(), 'wrong-secret');
    expect(res.status).toBe(401);
  });

  test('4. Missing service token returns 401', async () => {
    const res = await postCallback(kycCallbackBody(), undefined);
    expect(res.status).toBe(401);
  });

  test('5. Missing required fields returns 400', async () => {
    const body = kycCallbackBody();
    delete body.crms_customer_id;
    const res = await postCallback(body, process.env.PORTAL_CRM_SECRET);
    expect(res.status).toBe(400);
  });

  test('6. status = "verified" returns 400 (verification authority is CRM)', async () => {
    const res = await postCallback(
      kycCallbackBody({ status: 'verified' }),
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(400);
  });

  test('7. status = "rejected" returns 400 (verification authority is CRM)', async () => {
    const res = await postCallback(
      kycCallbackBody({ status: 'rejected' }),
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(400);
  });

  test('8. Company mismatch returns 403', async () => {
    const res = await postCallback(
      kycCallbackBody({ company_id: crossOrgCompanyId }),
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(403);
  });

  test('9. Unknown IntegrationEvent returns 404', async () => {
    const res = await postCallback(
      kycCallbackBody({ idempotency_key: 'crms-evt-999999' }),
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(404);
  });

  test('10. Unknown Customer returns 404', async () => {
    const res = await postCallback(
      {
        idempotency_key: `crms-evt-${unknownCustomerEventId}`,
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        status: 'submitted',
        company_id: companyId,
        crms_customer_id: 99999999,
      },
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(404);
  });

  test('11. IntegrationEvent/customer mismatch returns 409', async () => {
    const res = await postCallback(
      kycCallbackBody({ crms_customer_id: crossOrgCustomerId }),
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(409);
  });

  test('12. Callback creates NO new IntegrationEvent', async () => {
    freshCustomerId = (await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3D-F-${Date.now()}`,
        first_name: 'Fresh',
        last_name: 'Callback',
        phone: '6666666667',
        company_id: companyId,
      },
    })).id;
    const freshEvent = await p.integrationEvent.create({
      data: {
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        payload: JSON.stringify({ kyc_status: 'PENDING' }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: freshCustomerId,
        crms_booking_id: null,
      },
    });
    freshEventId = freshEvent.id;

    const countBefore = await p.integrationEvent.count();

    const res = await postCallback(
      {
        idempotency_key: `crms-evt-${freshEventId}`,
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        status: 'submitted',
        company_id: companyId,
        crms_customer_id: freshCustomerId,
      },
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(200);

    const countAfter = await p.integrationEvent.count();
    expect(countAfter).toBe(countBefore);
  });

  test('13. Raw PAN/Aadhaar in the callback is rejected at the boundary (400) and never persists', async () => {
    sensitiveCustomerId = (await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3D-S-${Date.now()}`,
        first_name: 'Sensitive',
        last_name: 'Callback',
        phone: '6666666668',
        company_id: companyId,
      },
    })).id;
    const sensitiveEvent = await p.integrationEvent.create({
      data: {
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        payload: JSON.stringify({ kyc_status: 'PENDING' }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: sensitiveCustomerId,
        crms_booking_id: null,
      },
    });
    sensitiveEventId = sensitiveEvent.id;

    const countBefore = await p.integrationEvent.count();

    const res = await postCallback(
      {
        idempotency_key: `crms-evt-${sensitiveEventId}`,
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        status: 'submitted',
        company_id: companyId,
        crms_customer_id: sensitiveCustomerId,
        pan_number: 'ABCDE1234F',
        aadhaar_number: '123456789012',
      },
      process.env.PORTAL_CRM_SECRET
    );
    // Strict schema — raw KYC data is not part of the contract and is rejected.
    expect(res.status).toBe(400);

    const customer = await p.customer.findUnique({ where: { id: sensitiveCustomerId } });
    expect(customer.kyc_submission_status).toBeNull();
    expect(customer.pan_number).toBeNull();
    expect(customer.aadhaar_number).toBeNull();

    const countAfter = await p.integrationEvent.count();
    expect(countAfter).toBe(countBefore);

    const audit = await p.auditEvent.findFirst({
      where: { action: 'KYC_CALLBACK_SUBMITTED', entity_id: sensitiveCustomerId },
    });
    expect(audit).toBeNull();
  });

  test('14. Processing failure returns 5xx (never 200) and does not persist partial state', async () => {
    failureCustomerId = (await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3D-FL-${Date.now()}`,
        first_name: 'Failure',
        last_name: 'Callback',
        phone: '6666666669',
        company_id: companyId,
      },
    })).id;
    const failureEvent = await p.integrationEvent.create({
      data: {
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        payload: JSON.stringify({ kyc_status: 'PENDING' }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: failureCustomerId,
        crms_booking_id: null,
      },
    });
    failureEventId = failureEvent.id;

    const txSpy = jest.spyOn(PrismaClient.prototype as any, '$transaction');
    txSpy.mockImplementationOnce(() => {
      throw new Error('simulated db failure');
    });

    try {
      const res = await postCallback(
        {
          idempotency_key: `crms-evt-${failureEventId}`,
          event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
          status: 'submitted',
          company_id: companyId,
          crms_customer_id: failureCustomerId,
        },
        process.env.PORTAL_CRM_SECRET
      );
      expect(res.status).toBeGreaterThanOrEqual(500);

      const customer = await p.customer.findUnique({ where: { id: failureCustomerId } });
      expect(customer.kyc_submission_status).toBeNull();
    } finally {
      txSpy.mockRestore();
    }

    // Recovery — after the transient failure the same callback succeeds.
    const res = await postCallback(
      {
        idempotency_key: `crms-evt-${failureEventId}`,
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        status: 'submitted',
        company_id: companyId,
        crms_customer_id: failureCustomerId,
      },
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(200);
    const customer = await p.customer.findUnique({ where: { id: failureCustomerId } });
    expect(customer.kyc_submission_status).toBe('SUBMITTED');
  });

  test('15. Idempotency key referencing a non-KYC event returns 409 (validates persisted event_type)', async () => {
    // The DTO declares CUSTOMER_KYC_STATUS_CHANGED (passes the schema), but the
    // referenced event is a 3B BOOKING_PORTAL_HANDOFF — the service must reject
    // against the PERSISTED event_type, not the request's.
    const res = await postCallback(
      {
        idempotency_key: `crms-evt-${handoffEventId}`,
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        status: 'submitted',
        company_id: companyId,
        crms_customer_id: customerId,
      },
      process.env.PORTAL_CRM_SECRET
    );
    expect(res.status).toBe(409);
  });

  test('16. Concurrent duplicate callbacks produce exactly one state transition and one audit', async () => {
    concurrentCustomerId = (await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3D-C-${Date.now()}`,
        first_name: 'Concurrent',
        last_name: 'Callback',
        phone: '6666666670',
        company_id: companyId,
      },
    })).id;
    const concurrentEvent = await p.integrationEvent.create({
      data: {
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        payload: JSON.stringify({ kyc_status: 'PENDING' }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: concurrentCustomerId,
        crms_booking_id: null,
      },
    });
    concurrentEventId = concurrentEvent.id;

    const body = {
      idempotency_key: `crms-evt-${concurrentEventId}`,
      event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
      status: 'submitted',
      company_id: companyId,
      crms_customer_id: concurrentCustomerId,
    };

    const [r1, r2] = await Promise.all([
      postCallback(body, process.env.PORTAL_CRM_SECRET),
      postCallback(body, process.env.PORTAL_CRM_SECRET),
    ]);

    // Both are 200 (one fresh transition, one idempotent duplicate) — never an error.
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const duplicates = [r1.body.duplicate, r2.body.duplicate].filter(v => v === true).length;
    const transitions = [r1.body.duplicate, r2.body.duplicate].filter(v => v === undefined).length;
    expect(transitions).toBe(1);
    expect(duplicates).toBe(1);

    // Exactly one submission audit, and the customer is SUBMITTED.
    const auditCount = await p.auditEvent.count({
      where: { action: 'KYC_CALLBACK_SUBMITTED', entity_id: concurrentCustomerId },
    });
    expect(auditCount).toBe(1);

    const customer = await p.customer.findUnique({ where: { id: concurrentCustomerId } });
    expect(customer.kyc_submission_status).toBe('SUBMITTED');
    expect(customer.kyc_submitted_at).toBeTruthy();
  });

  test('17. Sensitive KYC content cannot be smuggled through a free-form message field (400)', async () => {
    const countBefore = await p.integrationEvent.count();

    const res = await postCallback(
      {
        idempotency_key: `crms-evt-${sensitiveEventId}`,
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        status: 'submitted',
        company_id: companyId,
        crms_customer_id: sensitiveCustomerId,
        message: 'PAN ABCDE1234F / Aadhaar 123456789012 / Bank A/C 9999999999',
      },
      process.env.PORTAL_CRM_SECRET
    );
    // `message` is no longer part of the KYC callback contract; the strict schema
    // rejects it as an unknown key before any processing can read it.
    expect(res.status).toBe(400);

    const customer = await p.customer.findUnique({ where: { id: sensitiveCustomerId } });
    expect(customer.kyc_submission_status).toBeNull();
    expect(customer.pan_number).toBeNull();
    expect(customer.aadhaar_number).toBeNull();

    const countAfter = await p.integrationEvent.count();
    expect(countAfter).toBe(countBefore);

    const audit = await p.auditEvent.findFirst({
      where: { action: 'KYC_CALLBACK_SUBMITTED', entity_id: sensitiveCustomerId },
    });
    expect(audit).toBeNull();
  });
});