import { Roles } from '@rrh-ems/shared';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

const p = prisma as any;

// Public-website self-service account/shortlist/compare/activity/search —
// merged into the CRM backend so the static-exported marketing sites have a
// real server to call (see the comment on WebsiteAccount in schema.prisma).
describe('Public Website Account API', () => {
  let apiKey: string;
  let companyId: number;
  let employeeId: number;
  let propertyId: number;
  let otherAccountEmail: string;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();
    const getCode = (role: string) =>
      deterministicUsers.find((u) => u.roles[0] === role)!.employee_code;
    const md = (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } }))!;
    companyId = md.company_id;
    employeeId = md.id;

    const testApiKey = `WEBSITE-ACCOUNT-TEST-${Date.now()}`;
    await p.publicApiKey.create({
      data: { api_key: testApiKey, company_id: companyId, is_active: true },
    });
    apiKey = testApiKey;

    const property = await p.property.create({
      data: {
        property_code: `WA-PROP-${Date.now()}`,
        company_id: companyId,
        title: 'Shortlist Test Property',
        brand_type: 'SONTHILLU',
        category: 'APARTMENT',
        final_price: 8000000,
        area_sqft: 1400,
        location: 'Gachibowli, Hyderabad',
        city: 'Hyderabad',
        locality: 'Gachibowli',
        bedrooms: 2,
        bathrooms: 2,
        status: 'LIVE',
        assigned_pm_id: employeeId,
        created_by_id: employeeId,
      },
    });
    propertyId = property.id;
    await p.propertyPublication.create({
      data: {
        property_id: propertyId,
        company_id: companyId,
        is_published: true,
        published_at: new Date(),
      },
    });

    otherAccountEmail = `other-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    await p.websiteActivityEvent.deleteMany({ where: { company_id: companyId } });
    await p.websiteShortlistItem.deleteMany({ where: { property_id: propertyId } });
    await p.websiteCompareItem.deleteMany({ where: { property_id: propertyId } });
    await p.websiteAccount.deleteMany({ where: { company_id: companyId } });
    await p.propertyPublication.deleteMany({ where: { property_id: propertyId } });
    await p.property.deleteMany({ where: { id: propertyId } });
    await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
    await prisma.$disconnect();
  });

  const email = `visitor-${Date.now()}@example.com`;
  const password = 'Passw0rd123';
  let token: string;

  describe('Register / Login / Me', () => {
    it('1. Registers a new account and returns a bearer token', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/account/register')
        .set('x-api-key', apiKey)
        .send({ full_name: 'Test Visitor', email, password });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.account.email).toBe(email);
      expect(res.body.account).not.toHaveProperty('password_hash');
      token = res.body.token;
    });

    it('2. Rejects a duplicate email within the same company', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/account/register')
        .set('x-api-key', apiKey)
        .send({ full_name: 'Duplicate', email, password });

      expect(res.status).toBe(409);
    });

    it('3. Rejects a weak password', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/account/register')
        .set('x-api-key', apiKey)
        .send({ full_name: 'Weak Pw', email: otherAccountEmail, password: 'short' });

      expect(res.status).toBe(400);
    });

    it('4. Logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/account/login')
        .set('x-api-key', apiKey)
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('5. Rejects login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/account/login')
        .set('x-api-key', apiKey)
        .send({ email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('6. GET /account/me returns the authenticated account with a valid bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/account/me')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.account.email).toBe(email);
    });

    it('7. GET /account/me returns 401 without a bearer token', async () => {
      const res = await request(app).get('/api/v1/public/rrh/account/me').set('x-api-key', apiKey);
      expect(res.status).toBe(401);
    });

    it('8. GET /account/me returns 401 with a garbage token', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/account/me')
        .set('x-api-key', apiKey)
        .set('Authorization', 'Bearer not-a-real-token');

      expect(res.status).toBe(401);
    });

    it("9. A token issued under one company's API key is rejected by a different company's key", async () => {
      const otherCompany = await p.company.create({
        data: { name: `WA Other ${Date.now()}`, code: `WA-OTHER-${Date.now()}` },
      });
      const otherKey = `WA-OTHER-KEY-${Date.now()}`;
      await p.publicApiKey.create({
        data: { api_key: otherKey, company_id: otherCompany.id, is_active: true },
      });

      const res = await request(app)
        .get('/api/v1/public/rrh/account/me')
        .set('x-api-key', otherKey)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);

      await p.publicApiKey.deleteMany({ where: { api_key: otherKey } });
      await p.company.delete({ where: { id: otherCompany.id } });
    });
  });

  describe('Shortlist / Compare', () => {
    it('10. Adding a property to the shortlist is idempotent', async () => {
      const add = () =>
        request(app)
          .post('/api/v1/public/rrh/account/shortlist')
          .set('x-api-key', apiKey)
          .set('Authorization', `Bearer ${token}`)
          .send({ property_id: propertyId });

      const first = await add();
      expect(first.status).toBe(201);
      const second = await add();
      expect(second.status).toBe(201);

      const list = await request(app)
        .get('/api/v1/public/rrh/account/shortlist')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`);
      expect(list.body.items.length).toBe(1);
    });

    it('11. Removing from the shortlist works', async () => {
      const res = await request(app)
        .delete('/api/v1/public/rrh/account/shortlist')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`)
        .send({ property_id: propertyId });
      expect(res.status).toBe(200);

      const list = await request(app)
        .get('/api/v1/public/rrh/account/shortlist')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`);
      expect(list.body.items.length).toBe(0);
    });

    it('12. Compare is a separate list from shortlist', async () => {
      await request(app)
        .post('/api/v1/public/rrh/account/compare')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`)
        .send({ property_id: propertyId });

      const shortlist = await request(app)
        .get('/api/v1/public/rrh/account/shortlist')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`);
      const compare = await request(app)
        .get('/api/v1/public/rrh/account/compare')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`);

      expect(shortlist.body.items.length).toBe(0);
      expect(compare.body.items.length).toBe(1);
    });

    it('13. Rejects a saved-item body with neither property_id nor project_unit_id', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/account/shortlist')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('14. Rejects a saved-item body with both property_id and project_unit_id', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/account/shortlist')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`)
        .send({ property_id: propertyId, project_unit_id: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('Activity tracking', () => {
    it('15. Tracks an event for a logged-in account', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/activity/track')
        .set('x-api-key', apiKey)
        .set('Authorization', `Bearer ${token}`)
        .send({
          event_name: 'property_viewed',
          property_id: propertyId,
          page: `/properties/${propertyId}`,
        });
      expect(res.status).toBe(200);

      const events = await p.websiteActivityEvent.findMany({ where: { property_id: propertyId } });
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0].account_id).not.toBeNull();
    });

    it('16. Tracks an anonymous event without a bearer token', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/activity/track')
        .set('x-api-key', apiKey)
        .send({ event_name: 'property_viewed', property_id: propertyId, anonymous_id: 'anon-123' });
      expect(res.status).toBe(200);
    });

    it('17. Never fails the request even with a malformed body shape for optional fields', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/activity/track')
        .set('x-api-key', apiKey)
        .send({ event_name: 'page_view' });
      expect(res.status).toBe(200);
    });
  });

  describe('Search', () => {
    it('18. Filters by location and ranks the matching property first', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/search?location=Gachibowli')
        .set('x-api-key', apiKey);
      expect(res.status).toBe(200);
      expect(res.body.properties.some((p: any) => p.id === propertyId)).toBe(true);
    });

    it('19. A budget filter excludes properties outside the range (hard requirement)', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/search?minBudget=100000000&maxBudget=200000000')
        .set('x-api-key', apiKey);
      expect(res.status).toBe(200);
      expect(res.body.properties.some((p: any) => p.id === propertyId)).toBe(false);
    });

    it('20. Reports isGlobalEmpty when no properties exist for an unfiltered search', async () => {
      const emptyKeyCompany = await p.company.create({
        data: { name: `WA Empty ${Date.now()}`, code: `WA-EMPTY-${Date.now()}` },
      });
      const emptyKey = `WA-EMPTY-KEY-${Date.now()}`;
      await p.publicApiKey.create({
        data: { api_key: emptyKey, company_id: emptyKeyCompany.id, is_active: true },
      });

      const res = await request(app).get('/api/v1/public/rrh/search').set('x-api-key', emptyKey);
      expect(res.status).toBe(200);
      expect(res.body.isGlobalEmpty).toBe(true);

      await p.publicApiKey.deleteMany({ where: { api_key: emptyKey } });
      await p.company.delete({ where: { id: emptyKeyCompany.id } });
    });

    it('21. AI parse endpoint returns 503 when OPENAI_API_KEY is not configured', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/search/parse')
        .set('x-api-key', apiKey)
        .send({ query: '2bhk in gachibowli under 80 lakhs' });
      expect(res.status).toBe(503);
    });

    it('22. AI parse endpoint requires a query string', async () => {
      const res = await request(app)
        .post('/api/v1/public/rrh/search/parse')
        .set('x-api-key', apiKey)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
