import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('WR-7: Public Property Search Extension', () => {
  let companyId: number;
  let apiKey: string;
  let mdToken: string;
  let employeeId: number;

  const BRAND_RRH = 'rrh';
  const BRAND_SONTHILLU = 'sonthillu';

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    companyId = (await prisma.employee.findFirst({ where: { employee_code: getCode('Managing director') } }))!.company_id;
    employeeId = (await prisma.employee.findFirst({ where: { employee_code: getCode('Managing director') } }))!.id;

    const mdLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.2.200')
      .send({ employee_code: getCode('Managing director'), password: 'Password@123' });
    mdToken = mdLogin.body.accessToken;

    // Create test API key for RRH company
    const testApiKey = `WR7-PRICE-${Date.now()}`;
    await p.publicApiKey.create({
      data: { api_key: testApiKey, company_id: companyId, is_active: true },
    });
    apiKey = testApiKey;
  });

  afterAll(async () => {
    await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
    await prisma.$disconnect();
  });

  // Helper: create a property with specific fields
  const createProperty = async (overrides: any = {}) => {
    const defaultData = {
      property_code: `WR7-PROP-${Date.now()}`,
      company_id: companyId,
      title: 'Test Property',
      location: 'Test Location',
      category: 'VILLA',
      price: 1000000,
      area_sqft: 2000,
      bedrooms: 3,
      bathrooms: 2,
      brand_type: 'SONTHILLU',
      status: 'LIVE',
      assigned_pm_id: employeeId,
      created_by_id: employeeId,
    };
    const data = { ...defaultData, ...overrides };
    const prop = await p.property.create({ data });
    return prop;
  };

  // Helper: create a Sonthillu property
  const createSonthilluProperty = async (overrides: any = {}) => {
    return createProperty({ ...overrides, brand_type: 'SONTHILLU' });
  };

  // Helper: create an RRH property
  const createRrhProperty = async (overrides: any = {}) => {
    return createProperty({ ...overrides, brand_type: 'RADHA_REAL_HOMES' });
  };

// Helper: publish a property to a specific company (uses upsert to handle duplicates)
const publishProperty = async (propertyId: number, companyId: number) => {
  await p.propertyPublication.upsert({
    where: { property_id_company_id: { property_id: propertyId, company_id: companyId } },
    update: { is_published: true, published_at: new Date() },
    create: { property_id: propertyId, company_id: companyId, is_published: true, published_at: new Date() },
  });
};

  // ---- Price Filter Tests ----

  describe('Price range filter', () => {
    beforeAll(async () => {
      // Create two Sonthillu properties with different prices
      const prop1 = await createSonthilluProperty({ price: 500000 });
      const prop2 = await createSonthilluProperty({ price: 1500000 });
      // Publish to sonthillu brand company
      await publishProperty(prop1.id, companyId);
      await publishProperty(prop2.id, companyId);
    });

    it('1. price_min filter — returns properties with price >= value', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?price_min=750000`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      const over500k = props.filter((p: any) => p.price >= 750000);
      expect(over500k.length).toBe(props.length);
    });

    it('2. price_max filter — returns properties with price <= value', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?price_max=1250000`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      const under1250k = props.filter((p: any) => p.price <= 1250000);
      expect(under1250k.length).toBe(props.length);
    });

    it('3. price range — returns properties within [min, max]', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?price_min=750000&price_max=1500000`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      const inRange = props.every((p: any) => p.price >= 750000 && p.price <= 1500000);
      expect(inRange).toBe(true);
    });
  });

  // ---- Area filter ----

  describe('Area range filter', () => {
    beforeAll(async () => {
      // Create two Sonthillu properties with different areas
      const prop1 = await createSonthilluProperty({ area_sqft: 1500 });
      const prop2 = await createSonthilluProperty({ area_sqft: 3000 });
      // Publish to sonthillu brand company
      await publishProperty(prop1.id, companyId);
      await publishProperty(prop2.id, companyId);
    });

    it('4. area_min filter — returns properties with area_sqft >= value', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?area_min=2000`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      const over2000 = props.filter((p: any) => p.area_sqft && p.area_sqft >= 2000);
      expect(over2000.length).toBe(props.length);
    });

    it('5. area_max filter — returns properties with area_sqft <= value', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?area_max=2500`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      const under2500 = props.filter((p: any) => p.area_sqft && p.area_sqft <= 2500);
      expect(under2500.length).toBe(props.length);
    });

    it('6. area range — returns properties within [min, max]', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?area_min=1000&area_max=2500`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      const inRange = props.every((p: any) => p.area_sqft && p.area_sqft >= 1000 && p.area_sqft <= 2500);
      expect(inRange).toBe(true);
    });
  });

  // ---- Bedrooms/Bathrooms filters ----

  describe('Bedrooms and bathrooms filter', () => {
    beforeAll(async () => {
      // Create properties with different bedroom/bathroom counts
      const prop1 = await createSonthilluProperty({ bedrooms: 2, bathrooms: 1 });
      const prop2 = await createSonthilluProperty({ bedrooms: 4, bathrooms: 3 });
      // Publish to sonthillu brand company
      await publishProperty(prop1.id, companyId);
      await publishProperty(prop2.id, companyId);
    });

    it('7. bedrooms filter — returns properties with bedrooms >= value', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?bedrooms=3`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      const atLeast3 = props.filter((p: any) => p.bedrooms && p.bedrooms >= 3);
      expect(atLeast3.length).toBe(props.length);
    });

    it('8. bathrooms filter — returns properties with bathrooms >= value', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?bathrooms=2`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      const atLeast2 = props.filter((p: any) => p.bathrooms && p.bathrooms >= 2);
      expect(atLeast2.length).toBe(props.length);
    });
  });

  // ---- Sorting tests ----

  describe('Sorting', () => {
    beforeAll(async () => {
      // Create Sonthillu properties with different prices
      const prop1 = await createSonthilluProperty({ price: 3000000 });
      const prop2 = await createSonthilluProperty({ price: 1000000 });
      // Publish to sonthillu brand company
      await publishProperty(prop1.id, companyId);
      await publishProperty(prop2.id, companyId);
    });

    it('9. newest sort — returns properties sorted by created_at desc', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?sort=newest`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      // 'newest' sorts by created_at DESC - verify IDs are in descending order
      if (props.length >= 2) {
        expect(props[0].id).toBeGreaterThanOrEqual(props[1].id);
      }
    });

    it('10. price-asc sort — returns properties sorted by price ascending', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?sort=price-asc`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      if (props.length >= 2) {
        expect(props[0].price).toBeLessThanOrEqual(props[1].price);
      }
    });

    it('11. price-desc sort — returns properties sorted by price descending', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?sort=price-desc`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      expect(props.length).toBeGreaterThan(0);
      if (props.length >= 2) {
        expect(props[0].price).toBeGreaterThanOrEqual(props[1].price);
      }
    });
  });

  // ---- Pagination tests ----

  describe('Pagination', () => {
    beforeAll(async () => {
      // Create 5 Sonthillu properties
      for (let i = 0; i < 5; i++) {
        await createSonthilluProperty({ price: 1000000 + i * 100000 });
      }
      // Publish all 5 properties to sonthillu brand company
      const allProps = await p.property.findMany({
        where: { brand_type: 'SONTHILLU' },
        select: { id: true },
      });
      for (const prop of allProps) {
        await publishProperty(prop.id, companyId);
      }
    });

    it('13. default pagination — returns default limit (20) when page not specified', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.properties.length).toBeLessThanOrEqual(20);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(20);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('total_pages');
      expect(res.body).toHaveProperty('has_more');
    });

    it('14. custom page/limit — returns specified page and limit', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?page=1&limit=2`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.properties.length).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(2);
    });

    it('15. max limit enforcement — caps limit at 50', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?limit=100`)
        .set('x-api-key', apiKey);

      // Per WR-7 spec: limit > 50 → 400
      expect(res.status).toBe(400);
    });
  });

  // ---- Validation tests ----

  describe('Validation', () => {
    it('17. invalid numeric input → 400', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?price_min=abc`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(400);
    });

    it('18. min > max → 400', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?price_min=2000000&price_max=1000000`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(400);
    });

    it('19. invalid sort → 400', async () => {
      // Invalid sort value must return 400 per WR-7 contract
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?sort=invalid`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(400);
    });

    it('20. limit > 50 → 400', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?limit=100`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(400);
    });
  });

  // ---- Security / isolation tests ----

  describe('Security / isolation', () => {
    beforeAll(async () => {
      // Create an RRH property and a Sonthillu property
      await createRrhProperty({ price: 800000 });
      await createSonthilluProperty({ price: 500000 });
    });

    it('21. RRH cannot receive Sonthillu-only property', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_RRH}/properties`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      // RRH should only see RRH properties, not Sonthillu-only
      const sonthilluProps = props.filter((p: any) => p.brand_type === 'SONTHILLU');
      expect(sonthilluProps.length).toBe(0);
    });

    it('22. Sonthillu cannot receive RRH-only property', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      // Sonthillu should only see Sonthillu properties, not RRH-only
      const rrhProps = props.filter((p: any) => p.brand_type === 'RADHA_REAL_HOMES');
      expect(rrhProps.length).toBe(0);
    });

    it('23. unpublished property excluded', async () => {
      // Create a property without publishing it
      const unpubProp = await createSonthilluProperty({ status: 'PENDING_VERIFICATION' });
      // Do not publish it

      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      const found = props.find((p: any) => p.id === unpubProp.id);
      expect(found).toBeUndefined();
    });

    it('24. internal fields remain excluded', async () => {
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const props = res.body.properties;
      const prop = props[0];
      expect(prop).not.toHaveProperty('company_id');
      expect(prop).not.toHaveProperty('assigned_pm_id');
      expect(prop).not.toHaveProperty('created_by_id');
      expect(prop).not.toHaveProperty('latitude');
      expect(prop).not.toHaveProperty('longitude');
    });
  });

  // ---- Regression test ----

  describe('Regression', () => {
    it('25. existing public property behavior without WR-7 filters remains unchanged', async () => {
      // Create a Sonthillu property
      await createSonthilluProperty();

      // Query without any WR-7 filters
      const res = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.properties.length).toBeGreaterThan(0);

      // Verify existing filters still work (city, locality, listing_type, category)
      const cityRes = await request(app)
        .get(`/api/v1/public/${BRAND_SONTHILLU}/properties?city=Test%20Location`)
        .set('x-api-key', apiKey);

      expect(cityRes.status).toBe(200);
    });
  });
});