import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import bcrypt from 'bcryptjs';
import { Roles } from '@rrh-ems/shared';

// Mock puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(new Uint8Array(Buffer.from('%PDF-1.4 Mock PDF buffer for Agreement'))),
      close: jest.fn().mockResolvedValue(undefined),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));



let salesToken = '';
let testCompanyId = 0;
let bookingId = 0;
let documentId = 0;

describe('Phase 11.3 - Agreement Generation', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-secret-access';
    process.env.JWT_REFRESH_SECRET = 'test-secret-refresh';
    
    const hashedPassword = await bcrypt.hash('Password@123', 12);
    
    const testCompany = await prisma.company.upsert({
      where: { code: 'AGREEMENT_TEST_COMP' },
      update: {},
      create: { name: 'Agreement Test Company', code: 'AGREEMENT_TEST_COMP' },
    });
    testCompanyId = testCompany.id;

    const salesUser = await prisma.employee.upsert({
      where: { employee_code: 'AGREEMENT-SALES-001' },
      update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
      create: {
        employee_code: 'AGREEMENT-SALES-001',
        full_name: 'Agreement Sales',
        email: 'sales@agreement.test',
        phone: '+919999999222',
        password_hash: hashedPassword,
        company: { connect: { id: testCompanyId } },
      },
    });

    const salesRole = await prisma.role.upsert({ where: { name: Roles.SALES_MANAGER }, update: {}, create: { name: Roles.SALES_MANAGER } });
    await prisma.employeeRole.deleteMany({ where: { employee_id: salesUser.id } });
    await prisma.employeeRole.create({ data: { employee_id: salesUser.id, role_id: salesRole.id } });

    const customer = await prisma.customer.create({
      data: {
        customer_code: 'AGREEMENT-CUST-001',
        first_name: 'Agreement',
        last_name: 'Customer',
        phone: '+918888888889',
        company_id: testCompanyId,
      },
    });

    const project = await prisma.project.create({
      data: {
        project_code: 'AGREEMENT-PROJ-001',
        name: 'Agreement Project',
        location: 'Hyderabad',
        company_id: testCompanyId,
      },
    });

    const property = await prisma.property.create({
      data: {
        property_code: 'AGREEMENT-PROP-001',
        title: 'Agreement Property',
        brand_type: 'SONTHILLU',
        category: 'VILLA',
        price: 5000000,
        area_sqft: 2000,
        location: 'Hyderabad',
        company_id: testCompanyId,
        created_by_id: salesUser.id,
        project_id: project.id,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        booking_code: 'AGREEMENT-BOOK-001',
        customer_id: customer.id,
        property_id: property.id,
        company_id: testCompanyId,
        booking_date: new Date(),
        total_amount: 5000000,
        agreed_price: 5000000,
        balance_amount: 5000000,
        status: 'CONFIRMED',
        booked_by_id: salesUser.id,
      },
    });
    bookingId = booking.id;

    const loginRes = await request(app).post('/api/v1/auth/login').send({ employee_code: 'AGREEMENT-SALES-001', password: 'Password@123' });
    salesToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.document.deleteMany({ where: { id: documentId } });
    await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.property.deleteMany({ where: { project: { project_code: 'AGREEMENT-PROJ-001' } } });
    await prisma.project.deleteMany({ where: { project_code: 'AGREEMENT-PROJ-001' } });
    await prisma.customer.deleteMany({ where: { customer_code: 'AGREEMENT-CUST-001' } });
    await prisma.$disconnect();
  });

  it('should generate an agreement when valid booking ID is provided', async () => {
    const res = await request(app)
      .post('/api/v1/documents/generate-agreement')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ booking_id: bookingId });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Agreement generated successfully.');
    expect(res.body.document).toBeDefined();
    expect(res.body.document.document_type).toBe('LEGAL_AGREEMENT');
    expect(res.body.document.title).toContain('Sale Agreement');
    
    documentId = res.body.document.id;
  });
});
