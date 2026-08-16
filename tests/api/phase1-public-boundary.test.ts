import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 1 — Public Website API Boundary', () => {
  let mdToken: string;
  let mdEmployeeId: number;
  let companyId: number;
  let apiKey: string;
  let secondCompanyId: number;
  let secondCompanyKey: string;
  const cleanupLeadNames: string[] = [];
  const cleanupPropertyIds: number[] = [];
  const cleanupProjectIds: number[] = [];
  const cleanupPublicationIds: number[] = [];

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    const md = await prisma.employee.findFirst({ where: { employee_code: getCode('Managing director') } });
    companyId = md!.company_id;
    mdEmployeeId = md!.id;

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.3.100')
      .send({ employee_code: getCode('Managing director'), password: 'Password@123' });
    mdToken = loginRes.body.accessToken;

    const testApiKey = `PHASE1-RRH-${Date.now()}`;
    await p.publicApiKey.create({ data: { api_key: testApiKey, company_id: companyId, is_active: true } });
    apiKey = testApiKey;

    // A second company for brand-isolation checks (its own API key).
    const secondCompany = await p.company.create({
      data: { name: 'Phase1 Other Company', code: `PH1-OTHER-${Date.now()}`, property_type_group: 'RADHA_REAL_HOMES' },
    });
    secondCompanyId = secondCompany.id;
    const otherKey = `PHASE1-OTHER-${Date.now()}`;
    await p.publicApiKey.create({ data: { api_key: otherKey, company_id: secondCompanyId, is_active: true } });
    secondCompanyKey = otherKey;
  });

  afterAll(async () => {
    await p.lead.deleteMany({ where: { customer_name: { in: cleanupLeadNames } } });
    await p.propertyPublication.deleteMany({ where: { id: { in: cleanupPublicationIds } } });
    await p.property.deleteMany({ where: { id: { in: cleanupPropertyIds } } });
    await p.project.deleteMany({ where: { id: { in: cleanupProjectIds } } });
    await p.publicApiKey.deleteMany({ where: { api_key: { in: [apiKey, secondCompanyKey] } } });
    await p.company.deleteMany({ where: { id: secondCompanyId } });
    await prisma.$disconnect();
  });

  const createLiveProperty = async (opts: { company?: number; projectId?: number; latitude?: number; longitude?: number } = {}) => {
    const company = opts.company ?? companyId;
    const prop = await p.property.create({
      data: {
        property_code: `PH1-DETAIL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        company_id: company,
        title: 'Phase1 Detail Test Property',
        brand_type: 'RADHA_REAL_HOMES',
        category: 'PLOT',
        price: 5000000,
        area_sqft: 1500,
        location: 'Miyapur, Hyderabad',
        state: 'Telangana',
        city: 'Hyderabad',
        locality: 'Miyapur',
        pincode: '500049',
        listing_type: 'NEW',
        latitude: opts.latitude ?? null,
        longitude: opts.longitude ?? null,
        status: 'LIVE',
        project_id: opts.projectId ?? null,
        created_by_id: mdEmployeeId,
      },
    });
    cleanupPropertyIds.push(prop.id);
    return prop;
  };

  const publish = async (propertyId: number, company: number = companyId) => {
    const pub = await p.propertyPublication.create({
      data: { property_id: propertyId, company_id: company, is_published: true, published_at: new Date() },
    });
    cleanupPublicationIds.push(pub.id);
    return pub;
  };

  describe('Correlation / Request IDs', () => {
    it('1. Response carries a X-Request-Id header', async () => {
      const prop = await createLiveProperty();
      await publish(prop.id);
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);
      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(String(res.headers['x-request-id']).length).toBeGreaterThan(0);
    });
  });

  describe('Public lead validation', () => {
    it('2. Missing customer_name is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/leads')
        .set('x-api-key', apiKey)
        .send({ phone: '9999999999' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('3. Invalid email is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/leads')
        .set('x-api-key', apiKey)
        .send({ customer_name: 'Test User', phone: '9999999999', email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('4. Negative budget is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/leads')
        .set('x-api-key', apiKey)
        .send({ customer_name: 'Test User', phone: '9999999999', budget_max: -100 });
      expect(res.status).toBe(400);
    });

    it('5. Valid lead is captured (201) with WEBSITE source', async () => {
      const name = `Phase1 Valid ${Date.now()}`;
      cleanupLeadNames.push(name);
      const res = await request(app)
        .post('/api/v1/public/rrh/leads')
        .set('x-api-key', apiKey)
        .send({
          customer_name: name,
          phone: '9999999999',
          email: 'phase1@example.com',
          preferred_location: 'Miyapur',
          budget_max: 8000000,
          property_type_preference: 'PLOT',
        });
      expect(res.status).toBe(201);
      expect(res.body.leadId).toBeDefined();
      const lead = await p.lead.findUnique({ where: { id: res.body.leadId } });
      expect(lead.source).toBe('WEBSITE');
      expect(lead.company_id).toBe(companyId);
    });
  });

  describe('Public property detail', () => {
    it('6. Published LIVE property is visible with safe fields and no GPS', async () => {
      const prop = await createLiveProperty({ latitude: 17.4933, longitude: 78.3944 });
      await publish(prop.id);
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${prop.id}`)
        .set('x-api-key', apiKey);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(prop.id);
      expect(res.body.title).toBe('Phase1 Detail Test Property');
      expect(res.body.latitude).toBeUndefined();
      expect(res.body.longitude).toBeUndefined();
      expect(res.body.status).toBeUndefined();
      expect(res.body.company_id).toBeUndefined();
      expect(res.body.assigned_pm_id).toBeUndefined();
    });

    it('7. Unpublished property returns 404', async () => {
      const prop = await createLiveProperty();
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${prop.id}`)
        .set('x-api-key', apiKey);
      expect(res.status).toBe(404);
    });

    it('8. Reserved (active LOCKED) property returns 404', async () => {
      const prop = await createLiveProperty();
      await publish(prop.id);
      await p.property.update({ where: { id: prop.id }, data: { status: 'LOCKED', locked_until: new Date(Date.now() + 3600000) } });
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${prop.id}`)
        .set('x-api-key', apiKey);
      expect(res.status).toBe(404);
    });

    it('9. Expired LOCKED property is visible again', async () => {
      const prop = await createLiveProperty();
      await publish(prop.id);
      await p.property.update({ where: { id: prop.id }, data: { status: 'LOCKED', locked_until: new Date(Date.now() - 3600000) } });
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${prop.id}`)
        .set('x-api-key', apiKey);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(prop.id);
    });

    it('10. Invalid id returns 404', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties/not-a-number')
        .set('x-api-key', apiKey);
      expect(res.status).toBe(404);
    });

    it('11. Project relationship is exposed via detail select', async () => {
      const project = await p.project.create({
        data: {
          project_code: `PH1-PRJ-${Date.now()}`,
          company_id: companyId,
          name: 'Phase1 Test Project',
          location: 'Miyapur',
          status: 'UNDER_CONSTRUCTION',
        },
      });
      cleanupProjectIds.push(project.id);
      const prop = await createLiveProperty({ projectId: project.id });
      await publish(prop.id);
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${prop.id}`)
        .set('x-api-key', apiKey);
      expect(res.status).toBe(200);
      expect(res.body.project).toBeDefined();
      expect(res.body.project.id).toBe(project.id);
      expect(res.body.project.name).toBe('Phase1 Test Project');
      expect(res.body.project.status).toBe('UNDER_CONSTRUCTION');
    });
  });

  describe('Brand isolation', () => {
    it('12. Property published to another company is not visible via list', async () => {
      const otherProp = await createLiveProperty({ company: secondCompanyId });
      await publish(otherProp.id, secondCompanyId);
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);
      expect(res.status).toBe(200);
      const ids = res.body.map((x: any) => x.id);
      expect(ids).not.toContain(otherProp.id);
    });

    it('13. Property published to another company returns 404 via detail', async () => {
      const otherProp = await createLiveProperty({ company: secondCompanyId });
      await publish(otherProp.id, secondCompanyId);
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${otherProp.id}`)
        .set('x-api-key', apiKey);
      expect(res.status).toBe(404);
    });

    it('14. Other company key cannot read RRH-published property', async () => {
      const prop = await createLiveProperty();
      await publish(prop.id, companyId);
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${prop.id}`)
        .set('x-api-key', secondCompanyKey);
      expect(res.status).toBe(404);
    });

    it('15. No API key is rejected (401)', async () => {
      const res = await request(app).get('/api/v1/public/rrh/properties');
      expect(res.status).toBe(401);
    });
  });

  describe('Media / approved-only exposure', () => {
    it('17. Only APPROVED images are exposed on the public detail', async () => {
      const prop = await createLiveProperty();
      await publish(prop.id);
      await p.propertyImage.create({
        data: { property_id: prop.id, image_url: 'https://example.com/approved.jpg', is_primary: true, uploaded_by_id: mdEmployeeId, status: 'APPROVED' },
      });
      await p.propertyImage.create({
        data: { property_id: prop.id, image_url: 'https://example.com/pending.jpg', is_primary: false, uploaded_by_id: mdEmployeeId, status: 'PENDING' },
      });
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${prop.id}`)
        .set('x-api-key', apiKey);
      expect(res.status).toBe(200);
      const urls = res.body.images.map((img: any) => img.image_url);
      expect(urls).toContain('https://example.com/approved.jpg');
      expect(urls).not.toContain('https://example.com/pending.jpg');
    });
  });

  describe('Rate limiting (write path)', () => {
    it('18. Exceeding the public write limit returns 429 with RATE_LIMIT_EXCEEDED', async () => {
      const name = `Phase1 Rate ${Date.now()}`;
      cleanupLeadNames.push(name);
      let status429: number | null = null;
      let code: string | null = null;
      for (let i = 0; i < 12; i++) {
        const res = await request(app)
          .post('/api/v1/public/rrh/leads')
          .set('x-api-key', apiKey)
          .set('x-strict-rate-limit', 'true')
          .send({ customer_name: `${name}-${i}`, phone: '9999999999' });
        if (res.status === 429) {
          status429 = res.status;
          code = res.body.code;
          break;
        }
      }
      expect(status429).toBe(429);
      expect(code).toBe('RATE_LIMIT_EXCEEDED');
      // The 10 successful creates are cleaned up by customer_name prefix match below.
      const created = await p.lead.findMany({ where: { customer_name: { startsWith: `${name}-` } } });
      for (const lead of created) {
        cleanupLeadNames.push(lead.customer_name);
      }
    });
  });
});