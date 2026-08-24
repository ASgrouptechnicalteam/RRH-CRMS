import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Roles, Permissions } from '@rrh-ems/shared';

// Mock puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(new Uint8Array(Buffer.from('%PDF-1.4 Mock PDF buffer'))),
      close: jest.fn().mockResolvedValue(undefined),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

const prisma = new PrismaClient();

let financeToken = '';
let financeUserId = 0;
let mdToken = '';
let customerId = 0;
let propertyId = 0;
let bookingId = 0;
let paymentId = 0;
let testCompanyId = 0;

describe('Phase 11.2 - Receipt Generation', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-secret-access';
    process.env.JWT_REFRESH_SECRET = 'test-secret-refresh';
    
    const hashedPassword = await bcrypt.hash('Password@123', 12);
    
    const testCompany = await prisma.company.upsert({
      where: { code: 'RECEIPT_TEST_COMP' },
      update: {},
      create: { name: 'Receipt Test Company', code: 'RECEIPT_TEST_COMP' },
    });
    testCompanyId = testCompany.id;

    const financeUser = await prisma.employee.upsert({
      where: { employee_code: 'RECEIPT-FIN-001' },
      update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
      create: {
        employee_code: 'RECEIPT-FIN-001',
        full_name: 'Receipt Finance',
        email: 'fin@receipt.test',
        phone: '+919999999111',
        password_hash: hashedPassword,
        company: { connect: { id: testCompanyId } },
      },
    });
    financeUserId = financeUser.id;

    const mdUser = await prisma.employee.upsert({
      where: { employee_code: 'RECEIPT-MD-001' },
      update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
      create: {
        employee_code: 'RECEIPT-MD-001',
        full_name: 'Receipt MD',
        email: 'md@receipt.test',
        phone: '+919999999112',
        password_hash: hashedPassword,
        company: { connect: { id: testCompanyId } },
      },
    });

    const financeRole = await prisma.role.upsert({ where: { name: Roles.FINANCE }, update: {}, create: { name: Roles.FINANCE } });
    const mdRole = await prisma.role.upsert({ where: { name: Roles.MD }, update: {}, create: { name: Roles.MD } });

    await prisma.employeeRole.deleteMany({ where: { employee_id: { in: [financeUserId, mdUser.id] } } });
    await prisma.employeeRole.create({ data: { employee_id: financeUserId, role_id: financeRole.id } });
    await prisma.employeeRole.create({ data: { employee_id: mdUser.id, role_id: mdRole.id } });

    const customer = await prisma.customer.create({
      data: {
        customer_code: 'RECEIPT-CUST-001',
        first_name: 'Receipt',
        last_name: 'Customer',
        phone: '+918888888888',
        company_id: testCompanyId,
      },
    });
    customerId = customer.id;

    const project = await prisma.project.create({
      data: {
        project_code: 'RECEIPT-PROJ-001',
        name: 'Receipt Project',
        location: 'Hyderabad',
        company_id: testCompanyId,
      },
    });

    const property = await prisma.property.create({
      data: {
        property_code: 'RECEIPT-PROP-001',
        title: 'Receipt Property',
        brand_type: 'SONTHILLU',
        category: 'VILLA',
        price: 5000000,
        area_sqft: 2000,
        location: 'Hyderabad',
        company_id: testCompanyId,
        created_by_id: financeUserId,
        project_id: project.id,
      },
    });
    propertyId = property.id;

    const booking = await prisma.booking.create({
      data: {
        booking_code: 'RECEIPT-BOOK-001',
        customer_id: customer.id,
        property_id: property.id,
        company_id: testCompanyId,
        booking_date: new Date(),
        total_amount: 5000000,
        balance_amount: 5000000,
        status: 'CONFIRMED',
        booked_by_id: financeUserId,
      },
    });
    bookingId = booking.id;

    const payment = await prisma.payment.create({
      data: {
        payment_code: 'RECEIPT-PAY-001',
        company_id: testCompanyId,
        booking_id: booking.id,
        amount: 100000,
        payment_method: 'CASH',
        status: 'PENDING',
        recorded_by_id: financeUserId,
      }
    });
    paymentId = payment.id;

    const loginRes = await request(app).post('/api/v1/auth/login').send({ employee_code: 'RECEIPT-FIN-001', password: 'Password@123' });
    financeToken = loginRes.body.accessToken;
    
    const mdLoginRes = await request(app).post('/api/v1/auth/login').send({ employee_code: 'RECEIPT-MD-001', password: 'Password@123' });
    mdToken = mdLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.document.deleteMany({ where: { payment_id: paymentId } });
    await prisma.payment.deleteMany({ where: { id: paymentId } });
    await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await prisma.$disconnect();
  });

  it('should automatically generate a receipt when payment is verified as SUCCESS', async () => {
    const res = await request(app)
      .patch(`/api/v1/payments/${paymentId}/verify`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({ status: 'SUCCESS' });

    expect(res.status).toBe(200);

    // Wait a short moment for the background promise to resolve
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify document was created
    const docs = await prisma.document.findMany({
      where: {
        payment_id: paymentId,
        document_type: 'PAYMENT_RECEIPT',
      }
    });

    expect(docs.length).toBe(1);
    expect(docs[0].title).toContain('Receipt');
    expect(docs[0].mime_type).toBe('application/pdf');
    expect(docs[0].file_size).toBeGreaterThan(0);
  });
});
