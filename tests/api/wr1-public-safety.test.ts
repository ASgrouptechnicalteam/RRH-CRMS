import { Roles } from '@rrh-ems/shared';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);


const p = prisma as any;

describe('WR-1 P0-2: Public-Safe Property Responses', () => {
  let apiKey: string;
  let companyId: number;
  let propertyId: number;

  const INTERNAL_FIELDS = [
    'company_id',
    'branch_id',
    'assigned_pm_id',
    'created_by_id',
    'status',
    'rejection_reason',
    'locked_until',
    'locked_by_booking_id',
    'verified_by_pm_at',
    'dm_polished_at',
    'md_approved_at',
    'brand_type',
    'updated_at',
  ];

  const PUBLIC_FIELDS = [
    'id',
    'property_code',
    'title',
    'description',
    'category',
    'price',
    'area_sqft',
    'location',
    'address',
    'bedrooms',
    'bathrooms',
    'facing',
    'amenities',
    'possession_status',
    'details',
    'seo_title',
    'seo_keywords',
    'created_at',
    'images',
  ];

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    const mdEmployee = await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } });
    companyId = mdEmployee!.company_id;

    // Create a test API key
    const testApiKey = `WR1-TEST-KEY-${Date.now()}`;
    const createdKey = await p.publicApiKey.create({
      data: {
        api_key: testApiKey,
        company_id: companyId,
        is_active: true,
      },
    });
    apiKey = testApiKey;

    // Create a test property
    const prop = await p.property.create({
      data: {
        property_code: `WR1-SAFETY-${Date.now()}`,
        company_id: companyId,
        assigned_pm_id: mdEmployee!.id,
        title: 'Safety Test Property',
        brand_type: 'SONTHILLU',
        category: 'VILLA',
        price: 10000000,
        area_sqft: 2000,
        location: 'Test Location',
        status: 'LIVE',
        created_by_id: (await prisma.employee.findFirst())!.id,
        rejection_reason: 'INTERNAL: Some rejection reason',
      },
    });
    propertyId = prop.id;

    // Publish the property
    await p.propertyPublication.create({
      data: {
        property_id: propertyId,
        company_id: companyId,
        is_published: true,
        published_at: new Date(),
      },
    });
  });

  afterAll(async () => {
    await p.propertyPublication.deleteMany({ where: { property_id: propertyId } });
    await p.property.deleteMany({ where: { id: propertyId } });
    await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
    await prisma.$disconnect();
  });

  describe('Field Filtering', () => {
    it('returns only public-safe fields', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const prop = res.body.find((p: any) => p.id === propertyId);
      expect(prop).toBeDefined();

      // Verify public fields exist
      for (const field of PUBLIC_FIELDS) {
        expect(prop).toHaveProperty(field);
      }
    });

    it('does NOT expose internal fields', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const prop = res.body.find((p: any) => p.id === propertyId);
      expect(prop).toBeDefined();

      // Verify internal fields are absent
      for (const field of INTERNAL_FIELDS) {
        expect(prop).not.toHaveProperty(field);
      }
    });

    it('does NOT expose nested Employee objects', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const prop = res.body.find((p: any) => p.id === propertyId);
      expect(prop).toBeDefined();

      // Should not have assigned_pm, created_by, or any employee relations
      expect(prop).not.toHaveProperty('assigned_pm');
      expect(prop).not.toHaveProperty('created_by');
      expect(prop).not.toHaveProperty('employee');
    });

    it('images contain only safe fields', async () => {
      // Add a test image (status APPROVED so public API returns it)
      const image = await p.propertyImage.create({
        data: {
          property_id: propertyId,
          image_url: 'https://example.com/test.jpg',
          is_primary: true,
          uploaded_by_id: (await prisma.employee.findFirst())!.id,
          status: 'APPROVED',
        },
      });

      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const prop = res.body.find((p: any) => p.id === propertyId);
      expect(prop).toBeDefined();
      expect(prop.images).toBeDefined();
      expect(prop.images.length).toBeGreaterThanOrEqual(1);

      const img = prop.images[0];
      expect(img).toHaveProperty('id');
      expect(img).toHaveProperty('image_url');
      expect(img).toHaveProperty('is_primary');
      // Should NOT have uploaded_by_id or other internal fields
      expect(img).not.toHaveProperty('uploaded_by_id');
      expect(img).not.toHaveProperty('uploaded_by');

      // Clean up
      await p.propertyImage.delete({ where: { id: image.id } });
    });
  });

  describe('Broken FAQ Include Removed', () => {
    it('does not crash (faqs include removed)', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      // Should NOT be 500 (which would happen if faqs: true referenced a non-existent model)
      expect(res.status).not.toBe(500);
      expect(res.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('rejects request without API key', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties');

      expect(res.status).toBe(401);
    });

    it('rejects request with invalid API key', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', 'invalid-key-12345');

      expect(res.status).toBe(401);
    });
  });
});
