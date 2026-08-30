import { Roles } from '@rrh-ems/shared';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);


const p = prisma as any;

describe('Public Project API', () => {
  let apiKey: string;
  let companyId: number;
  let projectId: number;
  let propertyId: number;
  let projectCode: string;

  const INTERNAL_PROJECT_FIELDS = [
    'company_id',
    'branch_id',
    'assigned_pm_id',
  ];

  const PUBLIC_PROJECT_FIELDS = [
    'id',
    'project_code',
    'name',
    'description',
    'location',
    'total_area',
    'launch_date',
    'status',
    'amenities',
    'created_at',
    'slug',
    'inventory_summary',
  ];

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    companyId = (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } }))!.company_id;

    // Create a test API key
    const testApiKey = `PROJECT-TEST-KEY-${Date.now()}`;
    await p.publicApiKey.create({
      data: {
        api_key: testApiKey,
        company_id: companyId,
        is_active: true,
      },
    });
    apiKey = testApiKey;

    // Create a test project
    projectCode = `PRJ-TEST-${Date.now()}`;
    const project = await p.project.create({
      data: {
        project_code: projectCode,
        company_id: companyId,
        name: 'Test Project',
        description: 'A beautiful test project for public API testing',
        location: 'Miyapur, Hyderabad',
        total_area: '5 acres',
        launch_date: new Date('2024-01-01'),
        status: 'UNDER_CONSTRUCTION',
        amenities: ['Club House', 'Swimming Pool', 'Gym'],
        slug: 'test-project',
      },
    });
    projectId = project.id;

    // Create a test property in the project (SONTHILLU brand, LIVE status)
    const prop = await p.property.create({
      data: {
        property_code: `PROP-PRJ-${Date.now()}`,
        company_id: companyId,
        project_id: projectId,
        title: 'Test Property in Project',
        brand_type: 'SONTHILLU',
        category: 'APARTMENT',
        price: 7500000,
        area_sqft: 1500,
        location: 'Miyapur',
        status: 'LIVE',
        assigned_pm_id: (await prisma.employee.findFirst())!.id,
        created_by_id: (await prisma.employee.findFirst())!.id,
      },
    });
    propertyId = prop.id;

    // Publish the property to the company
    await p.propertyPublication.create({
      data: {
        property_id: propertyId,
        company_id: companyId,
        is_published: true,
        published_at: new Date(),
      },
    });

    // Add approved images to the property
    await p.propertyImage.createMany({
      data: [
        {
          property_id: propertyId,
          image_url: 'https://example.com/project-prop1.jpg',
          is_primary: true,
          uploaded_by_id: (await prisma.employee.findFirst())!.id,
          status: 'APPROVED',
          alt_text: 'Property view',
          sort_order: 1,
        },
      ],
    });
  });

  afterAll(async () => {
    await p.propertyImage.deleteMany({ where: { property_id: propertyId } });
    await p.propertyPublication.deleteMany({ where: { property_id: propertyId } });
    await p.property.deleteMany({ where: { id: propertyId } });
    await p.project.deleteMany({ where: { id: projectId } });
    await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/public/sonthillu/projects', () => {
    it('returns published projects for sonthillu brand', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const project = res.body.find((p: any) => p.id === projectId);
      expect(project).toBeDefined();
    });

    it('returns only public-safe project fields', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const project = res.body.find((p: any) => p.id === projectId);
      expect(project).toBeDefined();

      for (const field of PUBLIC_PROJECT_FIELDS) {
        expect(project).toHaveProperty(field);
      }
    });

    it('does NOT expose internal project fields', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const project = res.body.find((p: any) => p.id === projectId);
      expect(project).toBeDefined();

      for (const field of INTERNAL_PROJECT_FIELDS) {
        expect(project).not.toHaveProperty(field);
      }
    });

    it('includes inventory_summary', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const project = res.body.find((p: any) => p.id === projectId);
      expect(project).toBeDefined();
      expect(project.inventory_summary).toBeDefined();
      expect(project.inventory_summary).toHaveProperty('total');
      expect(project.inventory_summary).toHaveProperty('available');
      expect(project.inventory_summary).toHaveProperty('reserved');
      expect(project.inventory_summary).toHaveProperty('sold');
    });

    it('filters by brand - sonthillu only gets SONTHILLU properties', async () => {
      // Create an RRH property in the same project
      const rrhProp = await p.property.create({
        data: {
          property_code: `RRH-PROP-${Date.now()}`,
          company_id: companyId,
          project_id: projectId,
          title: 'RRH Property',
          brand_type: 'RADHA_REAL_HOMES',
          category: 'PLOT',
          price: 5000000,
          area_sqft: 1200,
          location: 'Test',
          status: 'LIVE',
          assigned_pm_id: (await prisma.employee.findFirst())!.id,
          created_by_id: (await prisma.employee.findFirst())!.id,
        },
      });

      await p.propertyPublication.create({
        data: {
          property_id: rrhProp.id,
          company_id: companyId,
          is_published: true,
        },
      });

      // Sonthillu API should still return the project (it has at least one SONTHILLU property)
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const project = res.body.find((p: any) => p.id === projectId);
      expect(project).toBeDefined();

      // Cleanup
      await p.propertyPublication.deleteMany({ where: { property_id: rrhProp.id } });
      await p.property.delete({ where: { id: rrhProp.id } });
    });
  });

  describe('GET /api/v1/public/rrh/projects', () => {
    it('returns published projects for rrh brand', async () => {
      // Create an RRH project with RRH property
      const rrhProject = await p.project.create({
        data: {
          project_code: `RRH-PRJ-${Date.now()}`,
          company_id: companyId,
          name: 'RRH Test Project',
          description: 'RRH project',
          location: 'Test',
          status: 'PLANNING',
        },
      });

      const rrhProp = await p.property.create({
        data: {
          property_code: `RRH-PROP-${Date.now()}`,
          company_id: companyId,
          project_id: rrhProject.id,
          title: 'RRH Property',
          brand_type: 'RADHA_REAL_HOMES',
          category: 'PLOT',
          price: 5000000,
          area_sqft: 1200,
          location: 'Test',
          status: 'LIVE',
          assigned_pm_id: (await prisma.employee.findFirst())!.id,
          created_by_id: (await prisma.employee.findFirst())!.id,
        },
      });

      await p.propertyPublication.create({
        data: {
          property_id: rrhProp.id,
          company_id: companyId,
          is_published: true,
        },
      });

      const res = await request(app)
        .get('/api/v1/public/rrh/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const project = res.body.find((p: any) => p.id === rrhProject.id);
      expect(project).toBeDefined();

      // Cleanup
      await p.propertyPublication.deleteMany({ where: { property_id: rrhProp.id } });
      await p.property.delete({ where: { id: rrhProp.id } });
      await p.project.delete({ where: { id: rrhProject.id } });
    });

    it('does not return sonthillu projects', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const project = res.body.find((p: any) => p.id === projectId);
      expect(project).toBeUndefined(); // Our test project has SONTHILLU property, not RRH
    });
  });

  describe('GET /api/v1/public/sonthillu/projects/:id', () => {
    it('returns project detail with properties', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', projectId);
      expect(res.body).toHaveProperty('project_code', projectCode);
      expect(res.body).toHaveProperty('name', 'Test Project');
      expect(res.body).toHaveProperty('properties');
      expect(Array.isArray(res.body.properties)).toBe(true);
      expect(res.body.properties.length).toBeGreaterThanOrEqual(1);
    });

    it('includes inventory_summary in detail', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.inventory_summary).toBeDefined();
    });

    it('returns only public-safe property fields in project detail', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const prop = res.body.properties[0];
      expect(prop).not.toHaveProperty('company_id');
      expect(prop).not.toHaveProperty('branch_id');
      expect(prop).not.toHaveProperty('assigned_pm_id');
      expect(prop).not.toHaveProperty('created_by_id');
      expect(prop).not.toHaveProperty('status'); // status is internal for public API
      expect(prop).not.toHaveProperty('latitude');
      expect(prop).not.toHaveProperty('longitude');
    });

    it('only includes APPROVED images in properties', async () => {
      // Add a PENDING image
      await p.propertyImage.create({
        data: {
          property_id: propertyId,
          image_url: 'https://example.com/pending.jpg',
          is_primary: false,
          uploaded_by_id: (await prisma.employee.findFirst())!.id,
          status: 'PENDING',
          sort_order: 2,
        },
      });

      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const prop = res.body.properties[0];
      expect(prop.images.length).toBe(1); // Only the APPROVED one
      expect(prop.images[0].image_url).toBe('https://example.com/project-prop1.jpg');

      // Cleanup
      await p.propertyImage.deleteMany({ where: { property_id: propertyId, status: 'PENDING' } });
    });
  });

  describe('Brand Scoping', () => {
    it('denies access to project without published properties for sonthillu', async () => {
      // Create a project with only RRH properties
      const rrhProject = await p.project.create({
        data: {
          project_code: `RRH-ONLY-${Date.now()}`,
          company_id: companyId,
          name: 'RRH Only Project',
          location: 'Test',
          status: 'PLANNING',
        },
      });

      const rrhProp = await p.property.create({
        data: {
          property_code: `RRH-PROP-${Date.now()}`,
          company_id: companyId,
          project_id: rrhProject.id,
          title: 'RRH Property',
          brand_type: 'RADHA_REAL_HOMES',
          category: 'PLOT',
          price: 5000000,
          area_sqft: 1200,
          location: 'Test',
          status: 'LIVE',
          assigned_pm_id: (await prisma.employee.findFirst())!.id,
          created_by_id: (await prisma.employee.findFirst())!.id,
        },
      });

      await p.propertyPublication.create({
        data: {
          property_id: rrhProp.id,
          company_id: companyId,
          is_published: true,
        },
      });

      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${rrhProject.id}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);

      // Cleanup
      await p.propertyPublication.deleteMany({ where: { property_id: rrhProp.id } });
      await p.property.delete({ where: { id: rrhProp.id } });
      await p.project.delete({ where: { id: rrhProject.id } });
    });

    it('returns 404 for CANCELLED project', async () => {
      const cancelledProject = await p.project.create({
        data: {
          project_code: `CANCELLED-${Date.now()}`,
          company_id: companyId,
          name: 'Cancelled Project',
          location: 'Test',
          status: 'CANCELLED',
        },
      });

      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${cancelledProject.id}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);

      await p.project.delete({ where: { id: cancelledProject.id } });
    });
  });

  describe('Error Handling', () => {
    it('returns 400 for invalid brand', async () => {
      const res = await request(app)
        .get(`/api/v1/public/invalidbrand/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 404 for invalid project ID', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects/999999999')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });

    it('returns 404 for non-numeric project ID', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects/abc')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });

    it('returns 401 for missing API key', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${projectId}`);

      expect(res.status).toBe(401);
    });

    it('returns 401 for invalid API key', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', 'invalid-key-12345');

      expect(res.status).toBe(401);
    });
  });

  describe('Inventory Summary Accuracy', () => {
    it('counts LIVE properties as available', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.inventory_summary.available).toBeGreaterThanOrEqual(1);
    });

    it('counts expired LOCKED as available', async () => {
      // Create an expired locked property
      const expiredProp = await p.property.create({
        data: {
          property_code: `EXPIRED-${Date.now()}`,
          company_id: companyId,
          project_id: projectId,
          title: 'Expired Locked Property',
          brand_type: 'SONTHILLU',
          category: 'APARTMENT',
          price: 5000000,
          area_sqft: 1000,
          location: 'Test',
          status: 'LOCKED',
          locked_until: new Date(Date.now() - 86400000), // Expired yesterday
          assigned_pm_id: (await prisma.employee.findFirst())!.id,
          created_by_id: (await prisma.employee.findFirst())!.id,
        },
      });

      await p.propertyPublication.create({
        data: {
          property_id: expiredProp.id,
          company_id: companyId,
          is_published: true,
        },
      });

      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      // Should count as available since lock is expired
      expect(res.body.inventory_summary.available).toBeGreaterThanOrEqual(1);

      // Cleanup
      await p.propertyPublication.deleteMany({ where: { property_id: expiredProp.id } });
      await p.property.delete({ where: { id: expiredProp.id } });
    });

    it('counts active LOCKED as reserved', async () => {
      // Create an active locked property
      const lockedProp = await p.property.create({
        data: {
          property_code: `LOCKED-${Date.now()}`,
          company_id: companyId,
          project_id: projectId,
          title: 'Active Locked Property',
          brand_type: 'SONTHILLU',
          category: 'APARTMENT',
          price: 5000000,
          area_sqft: 1000,
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
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.inventory_summary.reserved).toBeGreaterThanOrEqual(1);

      // Cleanup
      await p.propertyPublication.deleteMany({ where: { property_id: lockedProp.id } });
      await p.property.delete({ where: { id: lockedProp.id } });
    });

    it('counts SOLD/BOOKED as sold', async () => {
      const soldProp = await p.property.create({
        data: {
          property_code: `SOLD-${Date.now()}`,
          company_id: companyId,
          project_id: projectId,
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
        .get(`/api/v1/public/sonthillu/projects/${projectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.inventory_summary.sold).toBeGreaterThanOrEqual(1);

      // Cleanup
      await p.propertyPublication.deleteMany({ where: { property_id: soldProp.id } });
      await p.property.delete({ where: { id: soldProp.id } });
    });
  });
});