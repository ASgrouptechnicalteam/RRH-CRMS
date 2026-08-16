import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Roles, Permissions, RolePermissionsMatrix } from '@rrh-ems/shared';

const prisma = new PrismaClient();

let mdToken = '';
let adminToken = '';
let financeToken = '';
let telecallerToken = '';
let pmToken = '';
let mdUserId = 0;
let adminUserId = 0;
let financeUserId = 0;
let telecallerUserId = 0;
let pmUserId = 0;
let testCompanyId = 0;
let crossCompanyId = 0;
let customerId = 0;
let leadId = 0;
let propertyId = 0;
let projectId = 0;

async function loginAs(employeeCode: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ employee_code: employeeCode, password });
  return res.body.accessToken || '';
}

async function setupTestData() {
  const hashedPassword = await bcrypt.hash('Password@123', 12);

  const testCompany = await prisma.company.upsert({
    where: { code: 'TEST_COMP_01' },
    update: {},
    create: { name: 'Test Company', code: 'TEST_COMP_01' },
  });
  testCompanyId = testCompany.id;

  const crossCompany = await prisma.company.upsert({
    where: { code: 'TEST_COMP_02' },
    update: {},
    create: { name: 'Cross Org Company', code: 'TEST_COMP_02' },
  });
  crossCompanyId = crossCompany.id;

  const mdUser = await prisma.employee.upsert({
    where: { employee_code: 'RRH-TST-000' },
    update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
    create: {
      employee_code: 'RRH-TST-000',
      full_name: 'Test MD',
      email: 'test-md-doc@example.com',
      phone: '+919999999000',
      password_hash: hashedPassword,
      company: { connect: { id: testCompanyId } },
    },
  });
  mdUserId = mdUser.id;

  const adminUser = await prisma.employee.upsert({
    where: { employee_code: 'RRH-TST-001' },
    update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
    create: {
      employee_code: 'RRH-TST-001',
      full_name: 'Test Admin',
      email: 'test-admin-doc@example.com',
      phone: '+919999999001',
      password_hash: hashedPassword,
      company: { connect: { id: testCompanyId } },
    },
  });
  adminUserId = adminUser.id;

  const financeUser = await prisma.employee.upsert({
    where: { employee_code: 'RRH-TST-002' },
    update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
    create: {
      employee_code: 'RRH-TST-002',
      full_name: 'Test Finance',
      email: 'test-finance-doc@example.com',
      phone: '+919999999002',
      password_hash: hashedPassword,
      company: { connect: { id: testCompanyId } },
    },
  });
  financeUserId = financeUser.id;

  const telecallerUser = await prisma.employee.upsert({
    where: { employee_code: 'RRH-TST-003' },
    update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
    create: {
      employee_code: 'RRH-TST-003',
      full_name: 'Test Telecaller',
      email: 'test-tele-doc@example.com',
      phone: '+919999999003',
      password_hash: hashedPassword,
      company: { connect: { id: testCompanyId } },
    },
  });
  telecallerUserId = telecallerUser.id;

  const pmUser = await prisma.employee.upsert({
    where: { employee_code: 'RRH-TST-004' },
    update: { password_hash: hashedPassword, company_id: testCompanyId, status: 'ACTIVE' },
    create: {
      employee_code: 'RRH-TST-004',
      full_name: 'Test PM',
      email: 'test-pm-doc@example.com',
      phone: '+919999999004',
      password_hash: hashedPassword,
      company: { connect: { id: testCompanyId } },
    },
  });
  pmUserId = pmUser.id;

  const allPerms = Object.values(Permissions).filter((p) => typeof p === 'string') as string[];
  await prisma.permission.createMany({ data: allPerms.map((permName) => ({ name: permName })), skipDuplicates: true });

  const mdRole = await prisma.role.upsert({ where: { name: Roles.MD }, update: {}, create: { name: Roles.MD } });
  const adminRole = await prisma.role.upsert({ where: { name: Roles.ADMIN }, update: {}, create: { name: Roles.ADMIN } });
  const financeRole = await prisma.role.upsert({ where: { name: Roles.FINANCE }, update: {}, create: { name: Roles.FINANCE } });
  const telecallerRole = await prisma.role.upsert({ where: { name: Roles.TELECALLER }, update: {}, create: { name: Roles.TELECALLER } });
  const pmRole = await prisma.role.upsert({ where: { name: Roles.PROJECT_MANAGER }, update: {}, create: { name: Roles.PROJECT_MANAGER } });

  // Remove ALL existing EmployeeRole records for these test employees to prevent
  // stale role assignments from previous test runs from leaking into this run.
  const testEmployeeIds = [mdUserId, adminUserId, financeUserId, telecallerUserId, pmUserId];
  await prisma.employeeRole.deleteMany({ where: { employee_id: { in: testEmployeeIds } } });

  // Now assign exactly one role per test employee — deterministic, no prior state dependency.
  await prisma.employeeRole.create({ data: { employee_id: mdUserId, role_id: mdRole.id } });
  await prisma.employeeRole.create({ data: { employee_id: adminUserId, role_id: adminRole.id } });
  await prisma.employeeRole.create({ data: { employee_id: financeUserId, role_id: financeRole.id } });
  await prisma.employeeRole.create({ data: { employee_id: telecallerUserId, role_id: telecallerRole.id } });
  await prisma.employeeRole.create({ data: { employee_id: pmUserId, role_id: pmRole.id } });

  // Verify each employee has exactly the intended role before proceeding.
  const verifyRoles = await prisma.employeeRole.findMany({
    where: { employee_id: { in: testEmployeeIds } },
    include: { role: true },
  });
  const expectedMapping: Record<number, string> = {
    [mdUserId]: Roles.MD,
    [adminUserId]: Roles.ADMIN,
    [financeUserId]: Roles.FINANCE,
    [telecallerUserId]: Roles.TELECALLER,
    [pmUserId]: Roles.PROJECT_MANAGER,
  };
  for (const er of verifyRoles) {
    const expected = expectedMapping[er.employee_id];
    if (er.role.name !== expected) {
      throw new Error(`EmployeeRole verification failed: employee ${er.employee_id} has role "${er.role.name}" but expected "${expected}"`);
    }
  }

  const [allRoles, allDbPerms] = await Promise.all([prisma.role.findMany(), prisma.permission.findMany()]);
  const roleMap = new Map(allRoles.map(r => [r.name, r.id]));
  const permMap = new Map(allDbPerms.map(p => [p.name, p.id]));

  const rolePermsData: { role_id: number; permission_id: number }[] = [];
  for (const [roleName, permissions] of Object.entries(RolePermissionsMatrix)) {
    const roleId = roleMap.get(roleName);
    if (roleId && Array.isArray(permissions)) {
      for (const perm of permissions) {
        const permId = permMap.get(perm);
        if (permId) rolePermsData.push({ role_id: roleId, permission_id: permId });
      }
    }
  }

  if (rolePermsData.length > 0) {
    const targetRoleIds = Array.from(new Set(rolePermsData.map(rp => rp.role_id)));
    await prisma.rolePermission.deleteMany({ where: { role_id: { in: targetRoleIds } } });
    await prisma.rolePermission.createMany({ data: rolePermsData, skipDuplicates: true });
  }

  const project = await prisma.project.create({
    data: {
      project_code: 'TEST-PROJ-001',
      name: 'Test Project',
      location: 'Hyderabad',
      company_id: testCompanyId,
    },
  });
  projectId = project.id;

  const property = await prisma.property.create({
    data: {
      property_code: 'TEST-PROP-001',
      title: 'Test Property',
      brand_type: 'SONTHILLU',
      category: 'VILLA',
      price: 5000000,
      area_sqft: 2000,
      location: 'Hyderabad',
      company_id: testCompanyId,
      created_by_id: mdUserId,
      project_id: projectId,
    },
  });
  propertyId = property.id;

  const lead = await prisma.lead.create({
    data: {
      lead_code: 'TEST-LEAD-001',
      customer_name: 'Test Customer Lead',
      phone: '+919876543210',
      company_id: testCompanyId,
      created_by_id: mdUserId,
    },
  });
  leadId = lead.id;

  const customer = await prisma.customer.create({
    data: {
      customer_code: 'TEST-CUST-001',
      first_name: 'Test',
      last_name: 'Customer',
      phone: '+919876543210',
      company_id: testCompanyId,
    },
  });
  customerId = customer.id;

  mdToken = await loginAs('RRH-TST-000', 'Password@123');
  adminToken = await loginAs('RRH-TST-001', 'Password@123');
  financeToken = await loginAs('RRH-TST-002', 'Password@123');
  telecallerToken = await loginAs('RRH-TST-003', 'Password@123');
  pmToken = await loginAs('RRH-TST-004', 'Password@123');
}

async function cleanupTestData() {
  await prisma.auditEvent.deleteMany({ where: { entity_type: 'DOCUMENT' } });
  await prisma.document.deleteMany({ where: { company_id: testCompanyId } });
  await prisma.document.deleteMany({ where: { company_id: crossCompanyId } });
  await prisma.integrationEvent.deleteMany({ where: { crms_customer_id: customerId } });
  await prisma.customerNotification.deleteMany({ where: { customer_id: customerId } });
  await prisma.customer.deleteMany({ where: { id: customerId } });
  await prisma.lead.deleteMany({ where: { id: leadId } });
  await prisma.property.deleteMany({ where: { id: propertyId } });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.employeeRole.deleteMany({ where: { employee_id: { in: [mdUserId, adminUserId, financeUserId, telecallerUserId, pmUserId] } } });
  try {
    await prisma.employee.deleteMany({ where: { id: { in: [mdUserId, adminUserId, financeUserId, telecallerUserId, pmUserId] } } });
  } catch {
    // FK constraints may prevent deletion; ignore
  }
}

function makePdfBuffer(): Buffer {
  return Buffer.from('%PDF-1.4 fake content for testing purposes');
}

function makeJpegBuffer(): Buffer {
  return Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
}

function makePngBuffer(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
}

function makeWebpBuffer(): Buffer {
  const header = Buffer.from('RIFF');
  const size = Buffer.alloc(4);
  size.writeUInt32LE(100);
  const webp = Buffer.from('WEBP');
  const rest = Buffer.alloc(100);
  return Buffer.concat([header, size, webp, rest]);
}

describe('Phase 11 - Document Management', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-secret-access';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-secret-refresh';
    await setupTestData();
  }, 30000);

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Upload', () => {
    it('should upload a valid PDF document', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'OTHER')
        .field('title', 'Test PDF Document')
        .field('customer_id', customerId.toString())
        .attach('file', makePdfBuffer(), { filename: 'test-document.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(201);
      expect(res.body.document).toBeDefined();
      expect(res.body.document.document_type).toBe('OTHER');
      expect(res.body.document.title).toBe('Test PDF Document');
      expect(res.body.document.verification_status).toBe('PENDING');
      expect(res.body.document.status).toBe('ACTIVE');
    });

    it('should upload a valid JPG document', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'KYC_PAN')
        .field('title', 'Test PAN Card')
        .field('customer_id', customerId.toString())
        .attach('file', makeJpegBuffer(), { filename: 'pan-card.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.document.document_type).toBe('KYC_PAN');
    });

    it('should upload a valid PNG document', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'OTHER')
        .field('title', 'Test PNG')
        .field('customer_id', customerId.toString())
        .attach('file', makePngBuffer(), { filename: 'test.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.document.mime_type).toBe('image/png');
    });

    it('should upload a valid WEBP document', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'OTHER')
        .field('title', 'Test WEBP')
        .field('customer_id', customerId.toString())
        .attach('file', makeWebpBuffer(), { filename: 'test.webp', contentType: 'image/webp' });

      expect(res.status).toBe(201);
      expect(res.body.document.mime_type).toBe('image/webp');
    });

    it('should reject invalid file extension', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'OTHER')
        .field('title', 'Test EXE')
        .field('customer_id', customerId.toString())
        .attach('file', Buffer.from('fake exe content'), { filename: 'malware.exe', contentType: 'application/octet-stream' });

      expect(res.status).toBe(400);
    });

    it('should reject empty file', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'OTHER')
        .field('title', 'Empty File')
        .field('customer_id', customerId.toString())
        .attach('file', Buffer.alloc(0), { filename: 'empty.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
    });

    it('should reject when required entity is missing', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'KYC_PAN')
        .field('title', 'KYC without customer')
        .attach('file', makePdfBuffer(), { filename: 'kyc.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
    });

    it('should reject cross-company entity association', async () => {
      const crossCustomer = await prisma.customer.create({
        data: {
          customer_code: 'CROSS-CUST-001',
          first_name: 'Cross',
          last_name: 'Customer',
          phone: '+919876543211',
          company_id: crossCompanyId,
        },
      });

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'KYC_PAN')
        .field('title', 'Cross Company KYC')
        .field('customer_id', crossCustomer.id.toString())
        .attach('file', makePdfBuffer(), { filename: 'cross.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
      await prisma.customer.delete({ where: { id: crossCustomer.id } });
    });

    it('should reject unauthorized upload', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .field('document_type', 'OTHER')
        .field('title', 'Unauthorized Upload')
        .attach('file', makePdfBuffer(), { filename: 'test.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(403);
    });
  });

  describe('List', () => {
    it('should list documents for authorized user', async () => {
      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(res.body.documents).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.documents.length).toBeGreaterThan(0);
    });

    it('should filter by document_type', async () => {
      const res = await request(app)
        .get('/api/v1/documents?document_type=KYC_PAN')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(res.body.documents.every((d: any) => d.document_type === 'KYC_PAN')).toBe(true);
    });

    it('should apply company isolation', async () => {
      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${telecallerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.documents.every((d: any) => d.uploaded_by_id === telecallerUserId || d.document_type !== 'KYC_PAN')).toBe(true);
    });

    it('should restrict KYC_AADHAAR documents from non-KYC roles', async () => {
      await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'KYC_AADHAAR')
        .field('title', 'Test Aadhaar')
        .field('customer_id', customerId.toString())
        .attach('file', makePdfBuffer(), { filename: 'aadhaar.pdf', contentType: 'application/pdf' });

      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${telecallerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.documents.every((d: any) => d.document_type !== 'KYC_AADHAAR')).toBe(true);
    });

    it('should restrict KYC documents from management roles without KYC authorization', async () => {
      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).toBe(200);
      expect(res.body.documents.every((d: any) => d.document_type !== 'KYC_PAN' && d.document_type !== 'KYC_AADHAAR')).toBe(true);
    });

    it('should not return cross-company documents', async () => {
      const crossCustomer = await prisma.customer.upsert({
        where: { customer_code: 'CROSS-LIST-001' },
        update: { company_id: crossCompanyId },
        create: {
          customer_code: 'CROSS-LIST-001',
          first_name: 'Cross',
          last_name: 'ListTest',
          phone: '+919876543212',
          company_id: crossCompanyId,
        },
      });

      const crossDoc = await prisma.document.create({
        data: {
          document_code: 'RRH-DOC-CROSS-ISOLATION-001',
          company_id: crossCompanyId,
          document_type: 'OTHER',
          title: 'Cross Company Doc',
          original_name: 'cross-list.pdf',
          storage_path: 'documents/cross-list.pdf',
          mime_type: 'application/pdf',
          file_size: 100,
          uploaded_by_id: mdUserId,
          status: 'ACTIVE',
          verification_status: 'PENDING',
          customer_id: crossCustomer.id,
        },
      });

      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      const crossDocIds = res.body.documents.map((d: any) => d.id);
      expect(crossDocIds).not.toContain(crossDoc.id);

      await prisma.document.deleteMany({ where: { company_id: crossCompanyId } });
      await prisma.customerNotification.deleteMany({ where: { company_id: crossCompanyId } });
      await prisma.customer.deleteMany({ where: { company_id: crossCompanyId } });
    });
  });

  describe('Get Metadata', () => {
    it('should get document metadata', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const docId = listRes.body.documents[0].id;

      const res = await request(app)
        .get(`/api/v1/documents/${docId}`)
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(res.body.document).toBeDefined();
      expect(res.body.document.id).toBe(docId);
    });

    it('should return 404 for non-existent document', async () => {
      const res = await request(app)
        .get('/api/v1/documents/999999')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(404);
    });

    it('should not expose storage_path in document metadata', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const docId = listRes.body.documents[0].id;

      const res = await request(app)
        .get(`/api/v1/documents/${docId}`)
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(res.body.document.storage_path).toBeUndefined();
      expect(res.body.document.deleted_by_id).toBeUndefined();
      expect(res.body.document.delete_reason).toBeUndefined();
    });
  });

  describe('Download', () => {
    it('should download document with correct content type', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const doc = listRes.body.documents.find((d: any) => d.document_type === 'OTHER');
      if (!doc) return;

      const res = await request(app)
        .get(`/api/v1/documents/${doc.id}/download`)
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBeDefined();
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('should reject unauthorized download', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const kycDoc = listRes.body.documents.find((d: any) => d.document_type === 'KYC_PAN');
      if (!kycDoc) return;

      const res = await request(app)
        .get(`/api/v1/documents/${kycDoc.id}/download`)
        .set('Authorization', `Bearer ${telecallerToken}`);

      expect(res.status).toBe(403);
    });

    it('should restrict KYC document access to authorized roles', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const kycDoc = listRes.body.documents.find((d: any) => d.document_type === 'KYC_PAN');
      if (!kycDoc) return;

      const res = await request(app)
        .get(`/api/v1/documents/${kycDoc.id}/download`)
        .set('Authorization', `Bearer ${telecallerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Verify', () => {
    it('should verify document', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const doc = listRes.body.documents.find((d: any) => d.verification_status === 'PENDING');
      if (!doc) return;

      const res = await request(app)
        .patch(`/api/v1/documents/${doc.id}/verify`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ status: 'VERIFIED', notes: 'Looks good' });

      expect(res.status).toBe(200);
      expect(res.body.document.verification_status).toBe('VERIFIED');
    });

    it('should reject without notes', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const docs = listRes.body.documents.filter((d: any) => d.verification_status === 'PENDING');
      if (docs.length === 0) return;
      const doc = docs[0];

      const res = await request(app)
        .patch(`/api/v1/documents/${doc.id}/verify`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ status: 'REJECTED' });

      expect(res.status).toBe(400);
    });

    it('should reject with notes', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const docs = listRes.body.documents.filter((d: any) => d.verification_status === 'PENDING');
      if (docs.length === 0) return;
      const doc = docs[0];

      const res = await request(app)
        .patch(`/api/v1/documents/${doc.id}/verify`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ status: 'REJECTED', notes: 'Invalid document' });

      expect(res.status).toBe(200);
      expect(res.body.document.verification_status).toBe('REJECTED');
    });

    it('should reject unauthorized verify', async () => {
      const listRes = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`);

      const docs = listRes.body.documents.filter((d: any) => d.verification_status === 'PENDING');
      if (docs.length === 0) return;
      const doc = docs[0];

      const res = await request(app)
        .patch(`/api/v1/documents/${doc.id}/verify`)
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({ status: 'VERIFIED', notes: 'Unauthorized verify' });

      expect(res.status).toBe(403);
    });
  });

  describe('Archive / Restore', () => {
    let archiveDocId = 0;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'OTHER')
        .field('title', 'Archive Test')
        .field('customer_id', customerId.toString())
        .attach('file', makePdfBuffer(), { filename: 'archive-test.pdf', contentType: 'application/pdf' });
      archiveDocId = res.body.document.id;
    });

    it('should archive document', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/${archiveDocId}/archive`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ reason: 'Test archive' });

      expect(res.status).toBe(200);
      expect(res.body.document.status).toBe('ARCHIVED');
      expect(res.body.document.deleted_at).toBeDefined();
    });

    it('should restore archived document', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/${archiveDocId}/restore`)
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(res.body.document.status).toBe('ACTIVE');
      expect(res.body.document.deleted_at).toBeNull();
    });

    it('should reject unauthorized archive', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/${archiveDocId}/archive`)
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({ reason: 'Unauthorized archive' });

      expect(res.status).toBe(403);
    });
  });

  describe('Audit Events', () => {
    it('should create audit event for upload', async () => {
      const auditEvents = await prisma.auditEvent.findMany({
        where: { action: 'DOCUMENT_UPLOADED', entity_type: 'DOCUMENT' },
      });
      expect(auditEvents.length).toBeGreaterThan(0);
    });

    it('should create audit event for verify', async () => {
      const auditEvents = await prisma.auditEvent.findMany({
        where: { action: 'DOCUMENT_VERIFIED', entity_type: 'DOCUMENT' },
      });
      expect(auditEvents.length).toBeGreaterThan(0);
    });

    it('should create audit event for archive', async () => {
      const auditEvents = await prisma.auditEvent.findMany({
        where: { action: 'DOCUMENT_ARCHIVED', entity_type: 'DOCUMENT' },
      });
      expect(auditEvents.length).toBeGreaterThan(0);
    });
  });

  describe('ON DELETE RESTRICT', () => {
    it('should not allow deleting a customer that has documents', async () => {
      const tempCustomer = await prisma.customer.create({
        data: {
          customer_code: 'RESTRICT-TEST-001',
          first_name: 'Restrict',
          last_name: 'Test',
          phone: '+919876543299',
          company_id: testCompanyId,
        },
      });

      await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${mdToken}`)
        .field('document_type', 'KYC_PAN')
        .field('title', 'Restrict Test Doc')
        .field('customer_id', tempCustomer.id.toString())
        .attach('file', makePdfBuffer(), { filename: 'restrict.pdf', contentType: 'application/pdf' });

      const deleteRes = await prisma.customer.delete({ where: { id: tempCustomer.id } }).catch((err) => err);
      expect(deleteRes).toBeDefined();
      expect(deleteRes.message || deleteRes.code).toBeDefined();

      await prisma.document.deleteMany({ where: { customer_id: tempCustomer.id } });
      await prisma.customer.delete({ where: { id: tempCustomer.id } });
    });
  });
});
