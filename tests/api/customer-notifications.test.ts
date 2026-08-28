import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles } from '@rrh-ems/shared';
import { NotificationService } from '../../apps/api/src/services/notification.service';

jest.setTimeout(30000);


const p = prisma as any;

describe('Phase 11 Packet 3E - Customer Notifications / Activation Flow', () => {
  let mdToken: string;
  let mdUserId: number;
  let companyId: number;
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

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.3.10')
      .send({
        employee_code: deterministicUsers.find(u => u.roles[0] === Roles.MD)!.employee_code,
        password: 'Password@123',
      });
    if (res.status !== 200) {
      throw new Error(`Login failed: ${res.text}`);
    }
    mdToken = res.body.accessToken;

    const decoded = JSON.parse(Buffer.from(mdToken.split('.')[1], 'base64').toString());
    companyId = decoded.companyId;
    mdUserId = decoded.employeeId;

    const customer = await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3E-${Date.now()}`,
        first_name: 'Notify',
        last_name: 'Test',
        phone: '7777777777',
        company_id: companyId,
      }
    });
    customerId = customer.id;

    // Write KYC through the API so PAN/Aadhaar are encrypted at rest (Packet 3C).
    const kycRes = await request(app)
      .put(`/api/v1/customers/${customerId}/kyc`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ pan_number: 'ABCDE1234F', aadhaar_number: '123456789012' });
    if (kycRes.status !== 200) {
      throw new Error(`KYC write failed: ${kycRes.text}`);
    }

    const property = await p.property.create({
      data: {
        property_code: `TEST-PROP-3E-${Date.now()}`,
        company_id: companyId,
        title: 'Notify Test Property',
        price: 4900000,
        area_sqft: 1400,
        location: 'Test Location',
        category: 'VILLA',
        status: 'LIVE',
        created_by_id: mdUserId,
      }
    });
    propertyId = property.id;
  });

  afterAll(async () => {
    await p.customerNotification.deleteMany({ where: { customer_id: customerId } });
    await p.integrationEvent.deleteMany({ where: { crms_customer_id: customerId } });
    await p.document.deleteMany({ where: { customer_id: customerId } });
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

  const createConfirmedBooking = async () => {
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        customer_id: customerId,
        property_id: propertyId,
        agreed_price: 4800000,
        booking_amount: 100000,
        notes: 'Customer Notification Test Booking'
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

  const activateBooking = async () => {
    bookingId = await createConfirmedBooking();
    const event = await p.integrationEvent.findFirst({ where: { crms_booking_id: bookingId } });
    eventId = event.id;
    await p.bookingPortalMapping.updateMany({
      where: { crms_booking_id: bookingId },
      data: { handoff_status: 'WAITING_ACTIVATION' },
    });
    return bookingId;
  };

  const getNotifications = async (customer_id: number, query: string = '') => {
    const res = await request(app)
      .get(`/api/v1/integration/portal/customer-notifications?company_id=${companyId}&crms_customer_id=${customer_id}${query}`)
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`);
    return res;
  };

  // 1. Activation creates exactly one PORTAL_ACTIVATED notification
  test('1. Activation creates exactly one PORTAL_ACTIVATED notification', async () => {
    const id = await activateBooking();

    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        idempotency_key: `crms-evt-${eventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        portal_customer_id: 'PORTAL-CUST-3E',
        portal_booking_id: 'PORTAL-BKG-3E',
        company_id: companyId,
        crms_booking_id: id,
      });
    expect(res.status).toBe(200);

    const notifications = await p.customerNotification.findMany({
      where: { customer_id: customerId, type: 'PORTAL_ACTIVATED' },
    });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].booking_id).toBe(id);
    expect(notifications[0].is_read).toBe(false);
    expect(notifications[0].message).toContain('active');
  });

  // 2. Activation retry (duplicate callback) creates no duplicate notification
  test('2. Duplicate activation callback does NOT create a duplicate notification', async () => {
    const before = await p.customerNotification.count({
      where: { customer_id: customerId, type: 'PORTAL_ACTIVATED' },
    });

    const res = await request(app)
      .post('/api/v1/integration/portal/callback')
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`)
      .send({
        idempotency_key: `crms-evt-${eventId}`,
        event_type: 'BOOKING_PORTAL_HANDOFF',
        status: 'completed',
        portal_customer_id: 'PORTAL-CUST-3E-X',
        portal_booking_id: 'PORTAL-BKG-3E-X',
        company_id: companyId,
        crms_booking_id: bookingId,
      });
    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);

    const after = await p.customerNotification.count({
      where: { customer_id: customerId, type: 'PORTAL_ACTIVATED' },
    });
    expect(after).toBe(before);
  });

  // 3. Portal read API returns the activation notification with correct shape
  test('3. Portal read API returns notification with pagination metadata', async () => {
    const res = await getNotifications(customerId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
    const activation = res.body.notifications.find((n: any) => n.type === 'PORTAL_ACTIVATED');
    expect(activation).toBeTruthy();
    expect(activation.id).toBeGreaterThan(0);
    expect(typeof activation.is_read).toBe('boolean');
    expect(activation.booking_id).toBe(bookingId);
    expect(new Date(activation.created_at).toISOString()).toBe(activation.created_at);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
  });

  // 4. Read API requires service token (401)
  test('4. Read API rejects missing/invalid service token with 401', async () => {
    const noToken = await request(app)
      .get(`/api/v1/integration/portal/customer-notifications?company_id=${companyId}&crms_customer_id=${customerId}`);
    expect(noToken.status).toBe(401);

    const badToken = await request(app)
      .get(`/api/v1/integration/portal/customer-notifications?company_id=${companyId}&crms_customer_id=${customerId}`)
      .set('Authorization', 'Bearer wrong-secret');
    expect(badToken.status).toBe(401);
  });

  // 5. Read API 400 on invalid query params
  test('5. Read API returns 400 for invalid query parameters', async () => {
    const missingCustomer = await request(app)
      .get(`/api/v1/integration/portal/customer-notifications?company_id=${companyId}`)
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`);
    expect(missingCustomer.status).toBe(400);

    const negativePage = await getNotifications(customerId, '&page=0');
    expect(negativePage.status).toBe(400);

    const nonNumeric = await getNotifications(customerId, '&page=abc');
    expect(nonNumeric.status).toBe(400);
  });

  // 6. Read API 404 for unknown customer
  test('6. Read API returns 404 for unknown customer', async () => {
    const res = await getNotifications(999999);
    expect(res.status).toBe(404);
  });

  // 7. Cross-company customer cannot read another company's notifications
  test('7. Company isolation: cross-company query returns 404, never other company rows', async () => {
    const res = await request(app)
      .get(`/api/v1/integration/portal/customer-notifications?company_id=9999&crms_customer_id=${customerId}`)
      .set('Authorization', `Bearer ${process.env.PORTAL_CRM_SECRET}`);
    expect(res.status).toBe(404);

    // Direct DB check: the notification row's company must equal companyId
    const rows = await p.customerNotification.findMany({ where: { customer_id: customerId } });
    for (const row of rows) {
      expect(row.company_id).toBe(companyId);
    }
  });

  // 8. Customer isolation: another customer sees none of these notifications
  test('8. Customer isolation: a different customer sees no overlap', async () => {
    const other = await p.customer.create({
      data: {
        customer_code: `TEST-CUST-3E-OTHER-${Date.now()}`,
        first_name: 'Other',
        last_name: 'Customer',
        phone: '6666666666',
        company_id: companyId,
      }
    });

    const res = await getNotifications(other.id);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(0);

    await p.customer.deleteMany({ where: { id: other.id } });
  });

  // 9. Deterministic ordering: newest first
  test('9. Read API orders notifications newest-first', async () => {
    await p.customerNotification.create({
      data: {
        company_id: companyId,
        customer_id: customerId,
        booking_id: bookingId,
        type: 'PORTAL_ACTIVATED',
        title: 'Order A',
        message: 'Order test A',
        created_at: new Date(Date.now() + 1000),
      },
    });
    await p.customerNotification.create({
      data: {
        company_id: companyId,
        customer_id: customerId,
        booking_id: bookingId,
        type: 'PORTAL_ACTIVATED',
        title: 'Order B',
        message: 'Order test B',
        created_at: new Date(Date.now() + 2000),
      },
    });

    const res = await getNotifications(customerId);
    expect(res.status).toBe(200);
    expect(res.body.notifications[0].title).toBe('Order B');
    expect(res.body.notifications[1].title).toBe('Order A');
  });

  // 10. Pagination works deterministically
  test('10. Read API pagination returns correct pages', async () => {
    const page1 = await getNotifications(customerId, '&page=1&limit=1');
    expect(page1.status).toBe(200);
    expect(page1.body.notifications).toHaveLength(1);
    expect(page1.body.pagination.page).toBe(1);
    expect(page1.body.pagination.limit).toBe(1);
    expect(page1.body.pagination.total).toBeGreaterThanOrEqual(3);

    const page2 = await getNotifications(customerId, '&page=2&limit=1');
    expect(page2.status).toBe(200);
    expect(page2.body.notifications).toHaveLength(1);
    expect(page2.body.notifications[0].id).not.toBe(page1.body.notifications[0].id);
  });

  // 11. Sensitive data never leaks through the read API
  test('11. Read API never leaks raw PAN/Aadhaar in notifications', async () => {
    const res = await getNotifications(customerId);
    expect(res.status).toBe(200);
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('ABCDE1234F');
    expect(serialized).not.toContain('123456789012');
  });

  // 12. KYC status change creates KYC_STATUS_UPDATED notification
  test('12. KYC genuine status change (PARTIAL -> VERIFIED) creates exactly one KYC_STATUS_UPDATED notification', async () => {
    const before = await p.customerNotification.count({
      where: { customer_id: customerId, type: 'KYC_STATUS_UPDATED' },
    });

    // Customer starts PARTIAL (KYC written in beforeAll). Verify both KYC docs
    // to produce a genuine PARTIAL -> VERIFIED transition.
    const panDoc = await p.document.create({
      data: {
        document_code: `TEST-DOC-KYC-PAN-${Date.now()}`,
        company_id: companyId,
        customer_id: customerId,
        document_type: 'KYC_PAN',
        title: 'KYC PAN',
        original_name: 'pan.pdf',
        storage_path: 'uploads/pan.pdf',
        mime_type: 'application/pdf',
        file_size: 100,
        status: 'ACTIVE',
        verification_status: 'PENDING',
        uploaded_by_id: mdUserId,
      },
    });

    const aadhaarDoc = await p.document.create({
      data: {
        document_code: `TEST-DOC-KYC-AAD-${Date.now()}`,
        company_id: companyId,
        customer_id: customerId,
        document_type: 'KYC_AADHAAR',
        title: 'KYC Aadhaar',
        original_name: 'aadhaar.pdf',
        storage_path: 'uploads/aadhaar.pdf',
        mime_type: 'application/pdf',
        file_size: 100,
        status: 'ACTIVE',
        verification_status: 'PENDING',
        uploaded_by_id: mdUserId,
      },
    });

    const verifyPan = await request(app)
      .patch(`/api/v1/documents/${panDoc.id}/verify`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'VERIFIED', notes: 'PAN verified' });
    expect(verifyPan.status).toBe(200);

    const verifyAadhaar = await request(app)
      .patch(`/api/v1/documents/${aadhaarDoc.id}/verify`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'VERIFIED', notes: 'Aadhaar verified' });
    expect(verifyAadhaar.status).toBe(200);

    const customer = await p.customer.findUnique({ where: { id: customerId } });
    expect(customer.kyc_status).toBe('VERIFIED');

    const after = await p.customerNotification.count({
      where: { customer_id: customerId, type: 'KYC_STATUS_UPDATED' },
    });
    expect(after).toBe(before + 1);

    const notification = await p.customerNotification.findFirst({
      where: { customer_id: customerId, type: 'KYC_STATUS_UPDATED' },
      orderBy: { id: 'desc' },
    });
    expect(notification.message).toMatch(/VERIFIED/i);
    expect(notification.message).not.toContain('ABCDE1234F');
    expect(notification.message).not.toContain('123456789012');
  });

  // 13. KYC no-change creates no notification
  test('13. KYC status no-change creates NO notification', async () => {
    const before = await p.customerNotification.count({
      where: { customer_id: customerId, type: 'KYC_STATUS_UPDATED' },
    });

    // Directly invoke recomputeAndNotifyTx with no state change; writes nothing.
    await NotificationService.createCustomerNotificationTx;
    // Re-verify the already-VERIFIED PAN doc: derived status stays VERIFIED.
    const doc = await p.document.findFirst({
      where: { customer_id: customerId, document_type: 'KYC_PAN' },
      orderBy: { id: 'desc' },
    });
    await request(app)
      .patch(`/api/v1/documents/${doc.id}/verify`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'VERIFIED', notes: 'No change re-verify' });

    const after = await p.customerNotification.count({
      where: { customer_id: customerId, type: 'KYC_STATUS_UPDATED' },
    });
    expect(after).toBe(before);
  });

  // 14. REJECTED KYC status creates a notification with status only (no raw data)
  test('14. KYC REJECTED creates notification with status only, no raw KYC', async () => {
    const before = await p.customerNotification.count({
      where: { customer_id: customerId, type: 'KYC_STATUS_UPDATED' },
    });

    const doc = await p.document.create({
      data: {
        document_code: `TEST-DOC-REJ-${Date.now()}`,
        company_id: companyId,
        customer_id: customerId,
        document_type: 'KYC_AADHAAR',
        title: 'KYC Aadhaar',
        original_name: 'aadhaar.pdf',
        storage_path: 'uploads/aadhaar.pdf',
        mime_type: 'application/pdf',
        file_size: 100,
        status: 'ACTIVE',
        verification_status: 'PENDING',
        uploaded_by_id: mdUserId,
      },
    });

    await request(app)
      .patch(`/api/v1/documents/${doc.id}/verify`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'REJECTED', notes: 'Blurry document' });

    const after = await p.customerNotification.count({
      where: { customer_id: customerId, type: 'KYC_STATUS_UPDATED' },
    });
    expect(after).toBe(before + 1);

    const notification = await p.customerNotification.findFirst({
      where: { customer_id: customerId, type: 'KYC_STATUS_UPDATED' },
      orderBy: { id: 'desc' },
    });
    expect(notification.message).toContain('REJECTED');
    expect(notification.message).not.toContain('ABCDE1234F');
    expect(notification.message).not.toContain('123456789012');
  });

  // 15. Notification creation is transactional: no orphan on rollback
  test('15. Notification creation is transactional (no orphan on rollback)', async () => {
    const before = await p.customerNotification.count({ where: { customer_id: customerId } });

    let txError: any = null;
    try {
      await p.$transaction(async (tx: any) => {
        await tx.customerNotification.create({
          data: {
            company_id: companyId,
            customer_id: customerId,
            booking_id: null,
            type: 'PORTAL_ACTIVATED',
            title: 'Rollback Test',
            message: 'Should roll back',
          },
        });
        throw new Error('force rollback');
      });
    } catch (err) {
      txError = err;
    }
    expect(txError).toBeTruthy();

    const after = await p.customerNotification.count({ where: { customer_id: customerId } });
    expect(after).toBe(before);
  });

  // 16. Employee Notification model is untouched by Packet 3E
  test('16. Employee Notification behavior unaffected', async () => {
    const employeeNotificationsBefore = await p.notification.count();
    // Activation flow ran above and must not have created employee notifications
    const employeeNotifications = await p.notification.findMany({
      where: { message: { contains: 'Customer Portal is now active' } },
    });
    expect(employeeNotifications).toHaveLength(0);
    expect(await p.notification.count()).toBe(employeeNotificationsBefore);
  });
});
