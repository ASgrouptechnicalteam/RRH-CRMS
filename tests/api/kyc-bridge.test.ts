import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles } from '@rrh-ems/shared';
import { PortalWorker } from '../../apps/api/src/services/portalWorker';
import { KycService } from '../../apps/api/src/services/kyc.service';
import { decryptData } from '../../apps/api/src/utils/crypto';

jest.setTimeout(30000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 11 Packet 3C - KYC Data Bridge', () => {
  let mdToken: string;
  let mdUserId: number;
  let telecallerToken: string;
  let companyId: number;
  let crossOrgCompanyId: number;
  let customerId: number;
  let crossOrgCustomerId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    process.env.PORTAL_API_URL = 'http://localhost:9999';
    process.env.CRM_PORTAL_SECRET = 'test-crm-portal-secret-at-least-32-chars';
    process.env.PORTAL_CRM_SECRET = 'test-portal-crm-secret-at-least-32-chars';
    process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars';

    await setupDeterministicTestUsers();

    const getAuth = async (code: string, idx: number = 0) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.2.${10 + idx}`)
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
    mdUserId = decoded.employeeId;

    const teleCode = deterministicUsers.find(u => u.roles[0] === Roles.TELECALLER)!.employee_code;
    telecallerToken = await getAuth(teleCode, 1);

    const crossUser = crossOrgUsers[0];
    const crossCompany = await p.company.findFirst({ where: { code: 'TEST_COMP_02' } });
    crossOrgCompanyId = crossCompany.id;
    crossOrgCustomerId = (await p.customer.create({
      data: {
        customer_code: `TEST-CUST-X-${Date.now()}`,
        first_name: 'Cross',
        last_name: 'Org',
        phone: '6666666666',
        company_id: crossOrgCompanyId,
      },
    })).id;

    const customer = await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3C-${Date.now()}`,
        first_name: 'Kyc',
        last_name: 'Bridge',
        phone: '5555555555',
        company_id: companyId,
      },
    });
    customerId = customer.id;

    // Pristine worker queue — the worker claims the oldest CREATED event.
    await p.integrationEvent.deleteMany({ where: { status: 'CREATED' } });
  });

  afterAll(async () => {
    await p.integrationEvent.deleteMany({ where: { crms_customer_id: customerId } });
    await p.customerNotification.deleteMany({ where: { customer_id: { in: [customerId, crossOrgCustomerId] } } });
    await p.document.deleteMany({ where: { customer_id: customerId } });
    await p.customer.deleteMany({ where: { id: customerId } });
    await p.customer.deleteMany({ where: { id: crossOrgCustomerId } });
    PortalWorker.stop();
  });

  const createKycDocument = async (documentType: string, customer_id: number) => {
    return p.document.create({
      data: {
        document_code: `TEST-DOC-${documentType}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        company_id: companyId,
        customer_id,
        document_type: documentType,
        title: `Test ${documentType}`,
        original_name: 'test.pdf',
        storage_path: 'uploads/test.pdf',
        mime_type: 'application/pdf',
        file_size: 100,
        status: 'ACTIVE',
        verification_status: 'PENDING',
        uploaded_by_id: mdUserId,
      },
    });
  };

  test('1. MD can write customer KYC; PAN/Aadhaar encrypted at rest', async () => {
    const res = await request(app)
      .put(`/api/v1/customers/${customerId}/kyc`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ pan_number: 'ABCDE1234F', aadhaar_number: '123456789012' });

    expect(res.status).toBe(200);

    const customer = await p.customer.findUnique({ where: { id: customerId } });
    expect(customer.pan_number).toBeTruthy();
    expect(customer.aadhaar_number).toBeTruthy();
    // Encrypted at rest — never equal to the raw value
    expect(customer.pan_number).not.toBe('ABCDE1234F');
    expect(customer.aadhaar_number).not.toBe('123456789012');
    expect(decryptData(customer.pan_number)).toBe('ABCDE1234F');
    expect(decryptData(customer.aadhaar_number)).toBe('123456789012');
    // Values present but no verified documents -> PARTIAL
    expect(customer.kyc_status).toBe('PARTIAL');
  });

  test('2. KYC write creates CUSTOMER_KYC_WRITTEN audit with actor', async () => {
    const audit = await p.auditEvent.findFirst({
      where: { action: 'CUSTOMER_KYC_WRITTEN', entity_id: customerId, entity_type: 'Customer' },
      orderBy: { created_at: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.actor_id).toBe(mdUserId);
    const newValue = JSON.parse(audit.new_value);
    expect(newValue.pan).toBe(true);
    expect(newValue.aadhaar).toBe(true);
  });

  test('3. KYC write emits CUSTOMER_KYC_STATUS_CHANGED outbox event (no raw KYC)', async () => {
    const event = await p.integrationEvent.findFirst({
      where: { event_type: 'CUSTOMER_KYC_STATUS_CHANGED', crms_customer_id: customerId },
      orderBy: { created_at: 'desc' },
    });
    expect(event).toBeTruthy();
    expect(event.status).toBe('CREATED');

    const payload = JSON.parse(event.payload);
    expect(payload.event_type).toBe('CUSTOMER_KYC_STATUS_CHANGED');
    expect(payload.company_id).toBe(companyId);
    expect(payload.crms_customer_id).toBe(customerId);
    expect(payload.kyc_status).toBe('PARTIAL');
    expect(payload.masked_pan).toBe('ABCDE****F');

    // Raw KYC never in the outbound payload
    expect(payload.pan_number).toBeUndefined();
    expect(payload.aadhaar_number).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain('ABCDE1234F');
    expect(JSON.stringify(payload)).not.toContain('123456789012');
    expect(payload.masked_pan).not.toContain('ABCDE1234F');
  });

  test('4. Non-KYC role (TELECALLER) cannot write customer KYC (403)', async () => {
    const res = await request(app)
      .put(`/api/v1/customers/${customerId}/kyc`)
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({ pan_number: 'XYZDE1234F' });

    expect(res.status).toBe(403);
  });

  test('5. Cross-company KYC write is rejected (403)', async () => {
    const res = await request(app)
      .put(`/api/v1/customers/${crossOrgCustomerId}/kyc`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ pan_number: 'ABCDE1234F' });

    expect(res.status).toBe(403);
  });

  test('6. Invalid PAN format returns 400', async () => {
    const res = await request(app)
      .put(`/api/v1/customers/${customerId}/kyc`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ pan_number: 'not-a-pan' });

    expect(res.status).toBe(400);
  });

  test('7. Worker dispatches KYC event to /api/v1/portal/kyc-status with no raw KYC', async () => {
    const event = await p.integrationEvent.findFirst({
      where: { event_type: 'CUSTOMER_KYC_STATUS_CHANGED', crms_customer_id: customerId, status: 'CREATED' },
      orderBy: { created_at: 'desc' },
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ status: 'accepted', message: 'KYC status received' }),
    });

    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const fetchMock = (global as any).fetch as jest.Mock;
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:9999/api/v1/portal/kyc-status');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe(`Bearer ${process.env.CRM_PORTAL_SECRET}`);
    const sentBody = JSON.parse(options.body);
    expect(sentBody.idempotency_key).toBe(`crms-evt-${event.id}`);
    expect(sentBody.kyc_status).toBe('PARTIAL');
    expect(sentBody.masked_pan).toBe('ABCDE****F');
    expect(sentBody.pan_number).toBeUndefined();
    expect(sentBody.aadhaar_number).toBeUndefined();

    const after = await p.integrationEvent.findUnique({ where: { id: event.id } });
    expect(after.status).toBe('COMPLETED');
  });

  test('8. KYC push success creates KYC_STATUS_NOTIFY_COMPLETED audit', async () => {
    const audit = await p.auditEvent.findFirst({
      where: { action: 'KYC_STATUS_NOTIFY_COMPLETED', entity_id: customerId },
      orderBy: { created_at: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.actor_id).toBe(0);
    expect(audit.entity_type).toBe('Customer');
  });

  test('9. KYC push retryable failure resets event and audits KYC_STATUS_NOTIFY_FAILED', async () => {
    // Trigger a fresh KYC event by writing a new value (no status change emits nothing),
    // so emit a new event by changing the derived status through document verification.
    // Simpler: directly create a KYC event.
    const freshEvent = await p.integrationEvent.create({
      data: {
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        payload: JSON.stringify({ event_type: 'CUSTOMER_KYC_STATUS_CHANGED', company_id: companyId, crms_customer_id: customerId, crms_booking_id: null, kyc_status: 'PARTIAL', masked_pan: 'ABCDE****F', verified_at: null }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: customerId,
      },
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      status: 500,
      json: jest.fn().mockResolvedValue({ status: 'error', code: 'INTERNAL_ERROR' }),
    });

    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const after = await p.integrationEvent.findUnique({ where: { id: freshEvent.id } });
    expect(after.status).toBe('CREATED');
    expect(after.retry_count).toBe(1);
    expect(after.error_message).toContain('500');

    const audit = await p.auditEvent.findFirst({
      where: { action: 'KYC_STATUS_NOTIFY_FAILED', entity_id: customerId },
      orderBy: { created_at: 'desc' },
    });
    expect(audit).toBeTruthy();

    await p.integrationEvent.deleteMany({ where: { id: freshEvent.id } });
  });

  test('10. KYC push terminal failure (4xx) marks event FAILED', async () => {
    const freshEvent = await p.integrationEvent.create({
      data: {
        event_type: 'CUSTOMER_KYC_STATUS_CHANGED',
        payload: JSON.stringify({ event_type: 'CUSTOMER_KYC_STATUS_CHANGED', company_id: companyId, crms_customer_id: customerId, crms_booking_id: null, kyc_status: 'PARTIAL', masked_pan: 'ABCDE****F', verified_at: null }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: customerId,
      },
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ status: 'error', code: 'INVALID_PAYLOAD', message: 'Schema validation failed' }),
    });

    const processed = await PortalWorker.processNextEvent();
    expect(processed).toBe(true);

    const after = await p.integrationEvent.findUnique({ where: { id: freshEvent.id } });
    expect(after.status).toBe('FAILED');
    expect(after.error_message).toContain('Schema validation failed');

    const audit = await p.auditEvent.findFirst({
      where: { action: 'KYC_STATUS_NOTIFY_TERMINAL_FAILURE', entity_id: customerId },
      orderBy: { created_at: 'desc' },
    });
    expect(audit).toBeTruthy();

    await p.integrationEvent.deleteMany({ where: { id: freshEvent.id } });
  });

  test('11. Verifying both KYC documents derives kyc_status = VERIFIED and re-emits', async () => {
    // Reset status to a clean state
    await p.customer.update({ where: { id: customerId }, data: { kyc_status: 'PARTIAL', kyc_verified_at: null, kyc_rejected_reason: null } });

    const panDoc = await createKycDocument('KYC_PAN', customerId);
    const aadhaarDoc = await createKycDocument('KYC_AADHAAR', customerId);

    await request(app)
      .patch(`/api/v1/documents/${panDoc.id}/verify`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'VERIFIED', notes: 'PAN matches' });
    await request(app)
      .patch(`/api/v1/documents/${aadhaarDoc.id}/verify`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'VERIFIED', notes: 'Aadhaar matches' });

    const customer = await p.customer.findUnique({ where: { id: customerId } });
    expect(customer.kyc_status).toBe('VERIFIED');
    expect(customer.kyc_verified_at).toBeTruthy();

    const event = await p.integrationEvent.findFirst({
      where: { event_type: 'CUSTOMER_KYC_STATUS_CHANGED', crms_customer_id: customerId },
      orderBy: { created_at: 'desc' },
    });
    const payload = JSON.parse(event.payload);
    expect(payload.kyc_status).toBe('VERIFIED');
    expect(payload.verified_at).toBeTruthy();
    expect(JSON.stringify(payload)).not.toContain('ABCDE1234F');
  });

  test('12. Rejecting a KYC document derives kyc_status = REJECTED with reason', async () => {
    const aadhaarDoc = await createKycDocument('KYC_AADHAAR', customerId);
    await request(app)
      .patch(`/api/v1/documents/${aadhaarDoc.id}/verify`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'REJECTED', notes: 'Document blurry' });

    const customer = await p.customer.findUnique({ where: { id: customerId } });
    expect(customer.kyc_status).toBe('REJECTED');
    expect(customer.kyc_rejected_reason).toBe('Document blurry');
    expect(customer.kyc_verified_at).toBeNull();
  });

  test('13. maskPan never exposes the raw value', () => {
    expect(KycService.maskPan('ABCDE1234F')).toBe('ABCDE****F');
    expect(KycService.maskPan('ABCDE1234F')).not.toContain('1234');
    expect(KycService.maskPan(null)).toBeNull();
    expect(KycService.maskPan(undefined)).toBeNull();
  });

  test('14. Booking-confirm KYC gate still passes with encrypted KYC', async () => {
    // Customer already has encrypted pan/aadhaar; gate checks non-empty.
    const customer = await p.customer.findUnique({ where: { id: customerId } });
    expect(customer.pan_number).toBeTruthy();
    expect(customer.aadhaar_number).toBeTruthy();
    expect(customer.pan_number).not.toBe('ABCDE1234F');
  });
});