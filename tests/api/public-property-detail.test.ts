import { Roles } from '@rrh-ems/shared';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);


const p = prisma as any;

describe('Public Property Detail API', () => {
  let apiKey: string;
  let companyId: number;
  let pmUserId: number;
  let propertyId: number;
  let propertyCode: string;

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
    'latitude',
    'longitude',
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
    'project',
  ];

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    const mdEmployee = await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } });
    companyId = mdEmployee!.company_id;
    
    const pmEmployee = await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.PROJECT_MANAGER) } });
    pmUserId = pmEmployee!.id;

    // Create a test API key
    const testApiKey = `PROPERTY-DETAIL-TEST-${Date.now()}`;
    await p.publicApiKey.create({
      data: {
        api_key: testApiKey,
        company_id: companyId,
        is_active: true,
      },
    });
    apiKey = testApiKey;

    // Create a test property
    propertyCode = `PD-TEST-${Date.now()}`;
    const prop = await p.property.create({
      data: {
        property_code: propertyCode,
        company_id: companyId,
        assigned_pm_id: pmUserId,
        title: 'Detail Test Property',
        description: 'A beautiful test property for detail API testing',
        brand_type: 'SONTHILLU',
        category: 'APARTMENT',
        price: 7500000,
        area_sqft: 1500,
        location: 'Miyapur',
        address: '123 Test Street, Miyapur, Hyderabad',
        bedrooms: 3,
        bathrooms: 2,
        facing: 'EAST',
        amenities: '["Club House","Swimming Pool","Gym"]',
        possession_status: 'READY_TO_MOVE',
        state: 'Telangana',
        city: 'Hyderabad',
        locality: 'Miyapur',
        pincode: '500049',
        listing_type: 'NEW',
        status: 'LIVE',
        latitude: 17.4933, // Internal - should NOT be exposed
        longitude: 78.3968, // Internal - should NOT be exposed
        assigned_pm_id: (await prisma.employee.findFirst())!.id,
        created_by_id: (await prisma.employee.findFirst())!.id,
        seo_title: '3 BHK Apartment in Miyapur',
        seo_keywords: 'apartment, miyapur, 3bhk',
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

    // Add approved images
    await p.propertyImage.createMany({
      data: [
        {
          property_id: propertyId,
          image_url: 'https://example.com/image1.jpg',
          is_primary: true,
          uploaded_by_id: (await prisma.employee.findFirst())!.id,
          status: 'APPROVED',
          alt_text: 'Living room view',
          sort_order: 1,
        },
        {
          property_id: propertyId,
          image_url: 'https://example.com/image2.jpg',
          is_primary: false,
          uploaded_by_id: (await prisma.employee.findFirst())!.id,
          status: 'APPROVED',
          alt_text: 'Bedroom view',
          sort_order: 2,
        },
        {
          property_id: propertyId,
          image_url: 'https://example.com/pending.jpg',
          is_primary: false,
          uploaded_by_id: (await prisma.employee.findFirst())!.id,
          status: 'PENDING', // Should NOT appear
          sort_order: 3,
        },
      ],
    });
  });

  afterAll(async () => {
    await p.propertyImage.deleteMany({ where: { property_id: propertyId } });
    await p.propertyPublication.deleteMany({ where: { property_id: propertyId } });
    await p.property.deleteMany({ where: { id: propertyId } });
    await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
    await prisma.$disconnect();
  });

  describe('Success Cases', () => {
    it('returns property detail for published + available property', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', propertyId);
      expect(res.body).toHaveProperty('property_code', propertyCode);
      expect(res.body).toHaveProperty('title', 'Detail Test Property');
      expect(res.body).toHaveProperty('category', 'APARTMENT');
      expect(res.body).toHaveProperty('price', 7500000);
      expect(res.body).toHaveProperty('area_sqft', 1500);
      expect(res.body).toHaveProperty('location', 'Miyapur');
      expect(res.body).toHaveProperty('bedrooms', 3);
      expect(res.body).toHaveProperty('bathrooms', 2);
      expect(res.body).toHaveProperty('facing', 'EAST');
      expect(res.body).toHaveProperty('possession_status', 'READY_TO_MOVE');
      expect(res.body).toHaveProperty('listing_type', 'NEW');
    });

    it('returns project relationship when property has a project', async () => {
      // Create a project
      const project = await p.project.create({
        data: {
          project_code: `PUB-PRJ-${Date.now()}`,
          name: 'Test Project',
          company_id: companyId,
          location: 'Miyapur',
          status: 'UNDER_CONSTRUCTION',
        },
      });

      // Link property to project
      await p.property.update({
        where: { id: propertyId },
        data: { project_id: project.id },
      });

      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.project).toBeDefined();
      expect(res.body.project).toHaveProperty('id', project.id);
      expect(res.body.project).toHaveProperty('name', 'Test Project');

      // Cleanup
      await p.property.update({
        where: { id: propertyId },
        data: { project_id: null },
      });
      await p.project.delete({ where: { id: project.id } });
    });

    it('returns only APPROVED images', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.images).toBeDefined();
      expect(Array.isArray(res.body.images)).toBe(true);
      expect(res.body.images.length).toBe(2); // Only 2 APPROVED images

      // Verify image fields
      const primaryImage = res.body.images.find((img: any) => img.is_primary === true);
      expect(primaryImage).toBeDefined();
      expect(primaryImage).toHaveProperty('image_url', 'https://example.com/image1.jpg');

      // Should NOT have PENDING image
      const pendingImage = res.body.images.find((img: any) => img.image_url.includes('pending'));
      expect(pendingImage).toBeUndefined();
    });
  });

  describe('Field Filtering', () => {
    it('returns only public-safe fields', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);

      // Verify public fields exist
      for (const field of PUBLIC_FIELDS) {
        expect(res.body).toHaveProperty(field);
      }
    });

    it('does NOT expose internal fields', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);

      // Verify internal fields are absent
      for (const field of INTERNAL_FIELDS) {
        expect(res.body).not.toHaveProperty(field);
      }
    });

    it('does NOT expose exact GPS coordinates', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('latitude');
      expect(res.body).not.toHaveProperty('longitude');
    });

    it('does NOT expose seller/contact information', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('assigned_pm');
      expect(res.body).not.toHaveProperty('created_by');
      expect(res.body).not.toHaveProperty('seller');
      expect(res.body).not.toHaveProperty('contact');
    });

    it('does NOT expose internal documents', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('documents');
      expect(res.body).not.toHaveProperty('internal_notes');
    });

    it('images contain only safe fields', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.images.length).toBeGreaterThan(0);

      const img = res.body.images[0];
      expect(img).toHaveProperty('id');
      expect(img).toHaveProperty('image_url');
      expect(img).toHaveProperty('is_primary');
      expect(img).toHaveProperty('alt_text');
      // Should NOT have uploaded_by_id or other internal fields
      expect(img).not.toHaveProperty('uploaded_by_id');
      expect(img).not.toHaveProperty('uploaded_by');
      expect(img).not.toHaveProperty('status');
    });
  });

  describe('Availability Checks', () => {
    it('returns 404 for RESERVED (LOCKED) property', async () => {
      // Create a locked property
      const lockedProp = await p.property.create({
        data: {
          property_code: `LOCKED-${Date.now()}`,
          company_id: companyId,
          assigned_pm_id: pmUserId,
          title: 'Locked Property',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 10000000,
          area_sqft: 2000,
          location: 'Test',
          status: 'LOCKED',
          locked_until: new Date(Date.now() + 86400000), // Locked for 24 hours
          assigned_pm_id: (await prisma.employee.findFirst())!.id,
          created_by_id: (await prisma.employee.findFirst())!.id,
        },
      });

      await p.propertyPublication.create({
        data: {
          property_id: lockedProp.id,
          company_id: companyId,
          is_published: true,
        },
      });

      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${lockedProp.id}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);

      // Cleanup
      await p.propertyPublication.deleteMany({ where: { property_id: lockedProp.id } });
      await p.property.delete({ where: { id: lockedProp.id } });
    });

    it('returns 404 for SOLD property', async () => {
      const soldProp = await p.property.create({
        data: {
          property_code: `SOLD-${Date.now()}`,
          company_id: companyId,
          assigned_pm_id: pmUserId,
          title: 'Sold Property',
          brand_type: 'SONTHILLU',
          category: 'APARTMENT',
          price: 5000000,
          area_sqft: 1000,
          location: 'Test',
          status: 'SOLD',
          assigned_pm_id: (await prisma.employee.findFirst())!.id,
          created_by_id: (await prisma.employee.findFirst())!.id,
        },
      });

      await p.propertyPublication.create({
        data: {
          property_id: soldProp.id,
          company_id: companyId,
          is_published: true,
        },
      });

      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${soldProp.id}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);

      // Cleanup
      await p.propertyPublication.deleteMany({ where: { property_id: soldProp.id } });
      await p.property.delete({ where: { id: soldProp.id } });
    });

    it('returns 404 for UNPUBLISHED property', async () => {
      const unpublishedProp = await p.property.create({
        data: {
          property_code: `UNPUB-${Date.now()}`,
          company_id: companyId,
          assigned_pm_id: pmUserId,
          title: 'Unpublished Property',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 8000000,
          area_sqft: 1800,
          location: 'Test',
          status: 'LIVE',
          assigned_pm_id: (await prisma.employee.findFirst())!.id,
          created_by_id: (await prisma.employee.findFirst())!.id,
        },
      });

      // NOT published
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${unpublishedProp.id}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);

      // Cleanup
      await p.property.delete({ where: { id: unpublishedProp.id } });
    });
  });

  describe('Brand Scoping', () => {
    it('denies access to property published for different brand', async () => {
      // Create a different company
      const otherCompany = await p.company.create({
        data: {
          name: 'Other Company',
          code: `OTHER-${Date.now()}`,
          property_type_group: 'RADHA_REAL_HOMES',
        },
      });

      const otherApiKey = `OTHER-BRAND-${Date.now()}`;
      await p.publicApiKey.create({
        data: {
          api_key: otherApiKey,
          company_id: otherCompany.id,
          is_active: true,
        },
      });

      // Property is published to original company, not otherCompany
      const res = await request(app)
        .get(`/api/v1/public/rrh/properties/${propertyId}`)
        .set('x-api-key', otherApiKey);

      // Should return 404 because property is not published to this company
      expect(res.status).toBe(404);

      // Cleanup
      await p.publicApiKey.deleteMany({ where: { api_key: otherApiKey } });
      await p.company.delete({ where: { id: otherCompany.id } });
    });
  });

  describe('Error Handling', () => {
    it('returns 404 for invalid property ID', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/properties/999999999')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });

    it('returns 404 for non-numeric property ID', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/properties/abc')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid brand', async () => {
      const res = await request(app)
        .get(`/api/v1/public/invalidbrand/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 401 for missing API key', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`);

      expect(res.status).toBe(401);
    });

    it('returns 401 for invalid API key', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', 'invalid-key-12345');

      expect(res.status).toBe(401);
    });

    it('returns 401 for inactive API key', async () => {
      const inactiveKey = `INACTIVE-${Date.now()}`;
      await p.publicApiKey.create({
        data: {
          api_key: inactiveKey,
          company_id: companyId,
          is_active: false,
        },
      });

      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', inactiveKey);

      expect(res.status).toBe(401);

      // Cleanup
      await p.publicApiKey.deleteMany({ where: { api_key: inactiveKey } });
    });
  });

  describe('SEO Fields', () => {
    it('returns SEO fields when available', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('seo_title', '3 BHK Apartment in Miyapur');
      expect(res.body).toHaveProperty('seo_keywords', 'apartment, miyapur, 3bhk');
    });
  });

  describe('Structured Location', () => {
    it('returns structured location fields', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/properties/${propertyId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('state', 'Telangana');
      expect(res.body).toHaveProperty('city', 'Hyderabad');
      expect(res.body).toHaveProperty('locality', 'Miyapur');
      expect(res.body).toHaveProperty('pincode', '500049');
    });
  });
});
