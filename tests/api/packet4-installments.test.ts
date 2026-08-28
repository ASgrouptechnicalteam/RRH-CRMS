import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';
import { Roles } from '@rrh-ems/shared';

jest.setTimeout(45000);


const p = prisma as any;

describe('Phase 9 Packet 4 - Operational Installments & Collections', () => {
  let bookingId: number;
  let customerId: number;
  let propertyId: number;
  let companyId: number;

  let tokenAdmin: string;
  let tokenFinance: string;
  let tokenTelecaller: string;

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

    const adminCode = deterministicUsers.find(u => u.roles[0] === Roles.ADMIN)!.employee_code;
    const financeCode = deterministicUsers.find(u => u.roles[0] === Roles.FINANCE)!.employee_code;
    const telecallerCode = deterministicUsers.find(u => u.roles[0] === Roles.TELECALLER)!.employee_code;

    tokenAdmin = await getAuth(adminCode, 1);
    tokenFinance = await getAuth(financeCode, 2);
    tokenTelecaller = await getAuth(telecallerCode, 3);

    const decoded = JSON.parse(Buffer.from(tokenAdmin.split('.')[1], 'base64').toString());
    console.log('Decoded token payload:', decoded);
    companyId = decoded.companyId;
    const adminEmployeeId = decoded.employeeId;

    // Ensure we start from a clean state for this packet's tests
    // CustomerNotification rows (Phase 11 Packet 3E) reference customers via
    // ON DELETE RESTRICT — clear them first so customer.deleteMany never fails.
    await prisma.customerNotification.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.installment.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.property.deleteMany({});
    // Phase 11 Packet 3F/3H — clear outbox events too (shared worker queue).
    await prisma.integrationEvent.deleteMany({});

    // Setup base data
    const customer = await prisma.customer.create({
      data: {
        company_id: companyId,
        first_name: 'Packet 4',
        last_name: 'Customer',
        phone: '1111111111',
        status: 'NEW',
        customer_code: 'C-P4-001',
      }
    });
    customerId = customer.id;

    const property = await prisma.property.create({
      data: {
        assigned_pm_id: (await prisma.employee.findFirst())!.id,
        title: 'Packet 4 Title',
        company_id: companyId,
        status: 'BOOKED',
        price: 10000000,
        bedrooms: 3,
        area_sqft: 1000,
        facing: 'EAST',
        property_code: 'PROP-P4-001',
        location: 'Test Location',
        created_by_id: adminEmployeeId,
      }
    });
    propertyId = property.id;

    const booking = await prisma.booking.create({
      data: {
        company_id: companyId,
        booking_code: 'B-P4-001',
        customer_id: customerId,
        property_id: propertyId,
        agreed_price: 10000000,
        booking_amount: 100000,
        balance_amount: 9900000,
        status: 'INITIATED',
      }
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    // Phase 11 Packet 3F/3H — installment-linked verifyPayment SUCCESS now emits
    // PAYMENT_STATUS_CHANGED and INSTALLMENT_STATUS_CHANGED IntegrationEvents.
    // Clean them in dependency order so no CREATED events leak into the shared
    // test DB queue for later worker suites (e.g., portal-worker.test.ts).
    await prisma.integrationEvent.deleteMany({ where: { crms_booking_id: bookingId } });
    await prisma.integrationEvent.deleteMany({ where: { crms_customer_id: customerId } });
    await prisma.$disconnect();
  });

  let installmentId: number;

  it('A. Authorized user creates installment', async () => {
    const res = await request(app)
      .post('/api/v1/installments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({
        booking_id: bookingId,
        installment_number: 1,
        expected_amount: 500000,
        due_date: new Date(Date.now() + 86400000).toISOString(),
        remarks: 'First installment',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.expected_amount).toBe(500000);
    expect(res.body.status).toBe('PENDING');
    installmentId = res.body.id;
  });

  it('B. Unauthorized user cannot create installment', async () => {
    const res = await request(app)
      .post('/api/v1/installments')
      .set('Authorization', `Bearer ${tokenTelecaller}`)
      .send({
        booking_id: bookingId,
        installment_number: 2,
        expected_amount: 100000,
        due_date: new Date(Date.now() + 86400000).toISOString(),
      });
    
    // Telecaller lacks BOOKINGS_UPDATE permissions
    expect(res.status).toBe(403);
  });

  it('C. Retrieve installments (with lazy OVERDUE evaluation)', async () => {
    // Force due date to past for lazy evaluation check
    await prisma.installment.update({
      where: { id: installmentId },
      data: { due_date: new Date(Date.now() - 86400000) }
    });

    const res = await request(app)
      .get(`/api/v1/installments?booking_id=${bookingId}`)
      .set('Authorization', `Bearer ${tokenFinance}`);
    
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe('OVERDUE');
  });

  it('D. Duplicate installment number rejected', async () => {
    const res = await request(app)
      .post('/api/v1/installments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({
        booking_id: bookingId,
        installment_number: 1, // Duplicate
        expected_amount: 200000,
        due_date: new Date(Date.now() + 86400000).toISOString(),
      });
    
    expect(res.status).toBe(409);
  });

  let paymentId: number;

  it('E. Partial collection recorded safely (two-step)', async () => {
    // 1. Record
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({
        booking_id: bookingId,
        installment_id: installmentId,
        amount: 200000,
        payment_method: 'BANK_TRANSFER',
        reference_number: 'TXN-123',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    paymentId = res.body.id;

    // Check installment is unaffected before verification
    let inst = await prisma.installment.findUnique({ where: { id: installmentId }});
    expect(inst?.received_amount).toBe(0);

    // 2. Verify
    const verifyRes = await request(app)
      .put(`/api/v1/payments/${paymentId}/status`)
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ status: 'SUCCESS' });
    
    expect(verifyRes.status).toBe(200);

    // Check installment updated
    inst = await prisma.installment.findUnique({ where: { id: installmentId }});
    expect(inst?.received_amount).toBe(200000);
    expect(inst?.status).toBe('PARTIALLY_RECEIVED');

    // Check booking status not confirmed
    const bkg = await prisma.booking.findUnique({ where: { id: bookingId }});
    expect(bkg?.status).toBe('INITIATED');
    
    // Check booking balance UNCHANGED (Legacy rule untouched)
    expect(bkg?.balance_amount).toBe(9900000);
  });

  it('F. Complete partially paid installment', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({
        booking_id: bookingId,
        installment_id: installmentId,
        amount: 300000,
        payment_method: 'CASH',
      });
    
    const pId = res.body.id;

    const verifyRes = await request(app)
      .put(`/api/v1/payments/${pId}/status`)
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ status: 'SUCCESS' });
    
    expect(verifyRes.status).toBe(200);

    const inst = await prisma.installment.findUnique({ where: { id: installmentId }});
    expect(inst?.received_amount).toBe(500000);
    expect(inst?.status).toBe('RECEIVED');
    expect(inst?.received_date).not.toBeNull();
  });

  it('G. Overpayment rejected at record step', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({
        booking_id: bookingId,
        installment_id: installmentId,
        amount: 1, // Exceeds balance because it's already full
        payment_method: 'CASH',
      });
    
    expect(res.status).toBe(400);
  });

  it('H. Overpayment rejected during concurrent verification', async () => {
    // Create new installment expected 1,00,000
    const instRes = await request(app)
      .post('/api/v1/installments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({
        booking_id: bookingId,
        installment_number: 2,
        expected_amount: 100000,
        due_date: new Date(Date.now() + 86400000).toISOString(),
      });
    const iId = instRes.body.id;

    // Record two payments of 1,00,000 each (both valid at record time because they are pending)
    const p1 = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ booking_id: bookingId, installment_id: iId, amount: 100000, payment_method: 'CASH' });
    
    const p2 = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ booking_id: bookingId, installment_id: iId, amount: 100000, payment_method: 'CASH' });
    
    // Now verify them concurrently
    const [res1, res2] = await Promise.all([
      request(app).put(`/api/v1/payments/${p1.body.id}/status`).set('Authorization', `Bearer ${tokenFinance}`).send({ status: 'SUCCESS' }),
      request(app).put(`/api/v1/payments/${p2.body.id}/status`).set('Authorization', `Bearer ${tokenFinance}`).send({ status: 'SUCCESS' }),
    ]);

    // One must succeed (200), one must fail (409) because it detects optimistic lock failure
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    // Final installment state must be exactly 100000
    const instCheck = await prisma.installment.findUnique({ where: { id: iId }});
    expect(instCheck?.received_amount).toBe(100000);
  });

  it('I. Admin does not receive normal approval authority implicitly', async () => {
    // Admin creates payment
    const p1 = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ booking_id: bookingId, amount: 100, payment_method: 'CASH' }); // Legacy payment
    
    // Admin tries to verify
    const verifyRes = await request(app)
      .put(`/api/v1/payments/${p1.body.id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'SUCCESS' });
    
    // Forbidden because Admin lacks finance verifier explicitly
    expect(verifyRes.status).toBe(403);
  });

  it('J. Legacy Payment behavior remains compatible', async () => {
    // Finance creates and verifies legacy payment (no installment id)
    const p1 = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ booking_id: bookingId, amount: 50000, payment_method: 'CASH' });
    
    const verifyRes = await request(app)
      .put(`/api/v1/payments/${p1.body.id}/status`)
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ status: 'SUCCESS' });
    
    expect(verifyRes.status).toBe(200);

    // This should decrement the booking balance because it's legacy
    const bkg = await prisma.booking.findUnique({ where: { id: bookingId }});
    expect(bkg?.balance_amount).toBe(9900000 - 50000); // Because first installment didn't touch it
  });

  it('K. Audit event is created for collection mutation', async () => {
    const evts = await prisma.auditEvent.findMany({
      where: { action: 'INSTALLMENT_COLLECTED' }
    });
    expect(evts.length).toBeGreaterThan(0);
  });
});
