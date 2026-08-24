import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Roles } from '@rrh-ems/shared';
import { DocumentService } from '../../apps/api/src/services/document.service';

const prisma = new PrismaClient();

let salesToken = '';
let testCompanyId = 0;
let salesUserId = 0;
let documentId = 0;

describe('Phase 11.4 - E-Signature Workflow', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-secret-access';
    process.env.JWT_REFRESH_SECRET = 'test-secret-refresh';
    
    const hashedPassword = await bcrypt.hash('Password@123', 12);
    
    const testCompany = await prisma.company.upsert({
      where: { code: 'SIGN_TEST_COMP' },
      update: {},
      create: { name: 'Sign Test Company', code: 'SIGN_TEST_COMP' },
    });
    testCompanyId = testCompany.id;

    const salesUser = await prisma.employee.upsert({
      where: { employee_code: 'SIGN-SALES-001' },
      update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
      create: {
        employee_code: 'SIGN-SALES-001',
        full_name: 'Sign Sales',
        email: 'sales@sign.test',
        phone: '+919999999333',
        password_hash: hashedPassword,
        company: { connect: { id: testCompanyId } },
      },
    });
    salesUserId = salesUser.id;

    const salesRole = await prisma.role.upsert({ where: { name: Roles.SALES }, update: {}, create: { name: Roles.SALES } });
    await prisma.employeeRole.deleteMany({ where: { employee_id: salesUser.id } });
    await prisma.employeeRole.create({ data: { employee_id: salesUser.id, role_id: salesRole.id } });

    const doc = await prisma.document.create({
      data: {
        document_code: 'SIGN-DOC-001',
        company_id: testCompanyId,
        document_type: 'LEGAL_AGREEMENT',
        title: 'Sign Test Doc',
        original_name: 'test.pdf',
        storage_path: '/uploads/test.pdf',
        mime_type: 'application/pdf',
        file_size: 1024,
        uploaded_by_id: salesUser.id,
      }
    });
    documentId = doc.id;

    const loginRes = await request(app).post('/api/v1/auth/login').send({ employee_code: 'SIGN-SALES-001', password: 'Password@123' });
    salesToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.documentSignature.deleteMany({ where: { document_id: documentId } });
    await prisma.document.deleteMany({ where: { id: documentId } });
    await prisma.employeeRole.deleteMany({ where: { employee_id: salesUserId } });
    await prisma.employee.deleteMany({ where: { id: salesUserId } });
    await prisma.company.deleteMany({ where: { id: testCompanyId } });
    await prisma.$disconnect();
  });

  it('should initiate e-signature and then complete it via webhook', async () => {
    const userPayload = {
      employeeId: salesUserId,
      companyId: testCompanyId,
      branchId: 1,
      roles: [Roles.SALES],
      permissions: ['DOCUMENTS_READ', 'DOCUMENTS_CREATE']
    } as any;

    const initResult = await DocumentService.initiateESignature(userPayload, documentId, [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Doe', email: 'jane@example.com' }
    ]);

    expect(initResult.document.signature_status).toBe('PENDING_SIGNATURE');
    expect(initResult.signatures.length).toBe(2);
    expect(initResult.provider_id).toBeDefined();

    // Trigger webhook for first signer
    await DocumentService.handleESignatureWebhook(initResult.provider_id, 'signer_signed', 'john@example.com');
    
    let updatedDoc = await prisma.document.findUnique({ where: { id: documentId } });
    expect(updatedDoc?.signature_status).toBe('PARTIALLY_SIGNED');

    // Trigger webhook for second signer
    await DocumentService.handleESignatureWebhook(initResult.provider_id, 'signer_signed', 'jane@example.com');

    updatedDoc = await prisma.document.findUnique({ where: { id: documentId } });
    expect(updatedDoc?.signature_status).toBe('SIGNED');
  });
});
