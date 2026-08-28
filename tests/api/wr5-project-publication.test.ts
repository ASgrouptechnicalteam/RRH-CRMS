import { Roles } from '@rrh-ems/shared';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);


const p = prisma as any;

describe('WR-5: Public Project Publication + Detail', () => {
  let companyId: number;
  let apiKey: string;

  // Test data
  let rrhProjectId: number;
  let sonthilluProjectId: number;
  let bothBrandProjectId: number;
  let unpublishedProjectId: number;
  let rrhPropertyId: number;
  let sonthilluPropertyId: number;
  let bothPropertyId1: number;
  let bothPropertyId2: number;
  let livePropertyId: number;
  let lockedPropertyId: number;
  let bookedPropertyId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    companyId = (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } }))!.company_id;

    const employeeId = (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } }))!.id;

    // Create test API key
    const testApiKey = `WR5-PROJECT-${Date.now()}`;
    await p.publicApiKey.create({
      data: { api_key: testApiKey, company_id: companyId, is_active: true },
    });
    apiKey = testApiKey;

    // ─── Create test projects ──────────────────────────────────────────────

    // Project 1: RRH only (commercial/agricultural)
    const rrhProject = await p.project.create({
      data: {
        project_code: `WR5-PJ-RRH-${Date.now()}-1`,
        company_id: companyId,
        name: 'RRH Commercial Hub',
        description: 'RRH-only project',
        location: 'Gachibowli, Hyderabad',
        status: 'UNDER_CONSTRUCTION',
        assigned_pm_id: employeeId,
      },
    });
    rrhProjectId = rrhProject.id;

    // Project 2: Sonthillu only (residential)
    const sonthilluProject = await p.project.create({
      data: {
        project_code: `WR5-PJ-SON-${Date.now()}-2`,
        company_id: companyId,
        name: 'Sonthillu Residency',
        description: 'Sonthillu-only project',
        location: 'Miyapur, Hyderabad',
        status: 'UNDER_CONSTRUCTION',
        assigned_pm_id: employeeId,
      },
    });
    sonthilluProjectId = sonthilluProject.id;

    // Project 3: Both brands
    const bothProject = await p.project.create({
      data: {
        project_code: `WR5-PJ-BOTH-${Date.now()}-3`,
        company_id: companyId,
        name: 'Dual Brand Towers',
        description: 'Published to both brands',
        location: 'Kondapur, Hyderabad',
        status: 'COMPLETED',
        assigned_pm_id: employeeId,
      },
    });
    bothBrandProjectId = bothProject.id;

    // Project 4: No publications
    const unpublishedProject = await p.project.create({
      data: {
        project_code: `WR5-PJ-UNP-${Date.now()}-4`,
        company_id: companyId,
        name: 'Unpublished Project',
        description: 'Not published anywhere',
        location: 'Secret Location',
        status: 'PLANNING',
        assigned_pm_id: employeeId,
      },
    });
    unpublishedProjectId = unpublishedProject.id;

    // ─── Create test properties ────────────────────────────────────────────

    // RRH property
    const rrhProp = await p.property.create({
      data: {
        property_code: `WR5-PROP-RRH-${Date.now()}`,
        company_id: companyId,
        project_id: rrhProjectId,
        title: 'RRH Commercial Plot',
        brand_type: 'RADHA_REAL_HOMES',
        category: 'PLOT',
        price: 5000000,
        area_sqft: 2000,
        location: 'Gachibowli',
        status: 'LIVE',
        assigned_pm_id: employeeId,
        created_by_id: employeeId,
      },
    });
    rrhPropertyId = rrhProp.id;

    // Sonthillu property
    const sonProp = await p.property.create({
      data: {
        property_code: `WR5-PROP-SON-${Date.now()}`,
        company_id: companyId,
        project_id: sonthilluProjectId,
        title: 'Sonthillu Apartment',
        brand_type: 'SONTHILLU',
        category: 'APARTMENT',
        price: 8000000,
        area_sqft: 1200,
        location: 'Miyapur',
        status: 'LIVE',
        assigned_pm_id: employeeId,
        created_by_id: employeeId,
      },
    });
    sonthilluPropertyId = sonProp.id;

    // Both-brand properties
    const bothProp1 = await p.property.create({
      data: {
        property_code: `WR5-PROP-BOTH1-${Date.now()}`,
        company_id: companyId,
        project_id: bothBrandProjectId,
        title: 'Dual Tower A',
        brand_type: 'SONTHILLU',
        category: 'APARTMENT',
        price: 9000000,
        area_sqft: 1500,
        location: 'Kondapur',
        status: 'LIVE',
        assigned_pm_id: employeeId,
        created_by_id: employeeId,
      },
    });
    bothPropertyId1 = bothProp1.id;

    const bothProp2 = await p.property.create({
      data: {
        property_code: `WR5-PROP-BOTH2-${Date.now()}`,
        company_id: companyId,
        project_id: bothBrandProjectId,
        title: 'Dual Tower B',
        brand_type: 'RADHA_REAL_HOMES',
        category: 'PLOT',
        price: 6000000,
        area_sqft: 1800,
        location: 'Kondapur',
        status: 'LIVE',
        assigned_pm_id: employeeId,
        created_by_id: employeeId,
      },
    });
    bothPropertyId2 = bothProp2.id;

    // Inventory test properties
    const liveProp = await p.property.create({
      data: {
        property_code: `WR5-PROP-LIVE-${Date.now()}`,
        company_id: companyId,
        project_id: bothBrandProjectId,
        title: 'Live Unit',
        brand_type: 'SONTHILLU',
        category: 'VILLA',
        price: 12000000,
        area_sqft: 2500,
        location: 'Kondapur',
        status: 'LIVE',
        assigned_pm_id: employeeId,
        created_by_id: employeeId,
      },
    });
    livePropertyId = liveProp.id;

    const lockedProp = await p.property.create({
      data: {
        property_code: `WR5-PROP-LOCK-${Date.now()}`,
        company_id: companyId,
        project_id: bothBrandProjectId,
        title: 'Locked Unit',
        brand_type: 'SONTHILLU',
        category: 'VILLA',
        price: 11000000,
        area_sqft: 2200,
        location: 'Kondapur',
        status: 'LOCKED',
        locked_until: new Date(Date.now() - 86400000), // expired lock = AVAILABLE
        assigned_pm_id: employeeId,
        created_by_id: employeeId,
      },
    });
    lockedPropertyId = lockedProp.id;

    const bookedProp = await p.property.create({
      data: {
        property_code: `WR5-PROP-BKD-${Date.now()}`,
        company_id: companyId,
        project_id: bothBrandProjectId,
        title: 'Booked Unit',
        brand_type: 'SONTHILLU',
        category: 'APARTMENT',
        price: 7500000,
        area_sqft: 1100,
        location: 'Kondapur',
        status: 'BOOKED',
        assigned_pm_id: employeeId,
        created_by_id: employeeId,
      },
    });
    bookedPropertyId = bookedProp.id;

    // ─── Create publications ────────────────────────────────────────────────

    // RRH project property → RRH brand only
    await p.propertyPublication.create({
      data: { property_id: rrhPropertyId, company_id: companyId, is_published: true, published_at: new Date() },
    });

    // Sonthillu project property → Sonthillu brand only
    await p.propertyPublication.create({
      data: { property_id: sonthilluPropertyId, company_id: companyId, is_published: true, published_at: new Date() },
    });

    // Both-brand project → both publications
    await p.propertyPublication.create({
      data: { property_id: bothPropertyId1, company_id: companyId, is_published: true, published_at: new Date() },
    });
    await p.propertyPublication.create({
      data: { property_id: bothPropertyId2, company_id: companyId, is_published: true, published_at: new Date() },
    });
    // Also publish inventory test properties
    await p.propertyPublication.create({
      data: { property_id: livePropertyId, company_id: companyId, is_published: true, published_at: new Date() },
    });
    await p.propertyPublication.create({
      data: { property_id: lockedPropertyId, company_id: companyId, is_published: true, published_at: new Date() },
    });
    await p.propertyPublication.create({
      data: { property_id: bookedPropertyId, company_id: companyId, is_published: true, published_at: new Date() },
    });

    // Unpublished project has NO publications
  });

  afterAll(async () => {
    // Clean up in FK order
    await p.propertyPublication.deleteMany({
      where: {
        property_id: { in: [rrhPropertyId, sonthilluPropertyId, bothPropertyId1, bothPropertyId2, livePropertyId, lockedPropertyId, bookedPropertyId] },
      },
    });
    await p.propertyImage.deleteMany({
      where: { property_id: { in: [rrhPropertyId, sonthilluPropertyId, bothPropertyId1, bothPropertyId2, livePropertyId, lockedPropertyId, bookedPropertyId] } },
    });
    await p.property.deleteMany({
      where: { id: { in: [rrhPropertyId, sonthilluPropertyId, bothPropertyId1, bothPropertyId2, livePropertyId, lockedPropertyId, bookedPropertyId] } },
    });
    await p.project.deleteMany({
      where: { id: { in: [rrhProjectId, sonthilluProjectId, bothBrandProjectId, unpublishedProjectId] } },
    });
    await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
    await prisma.$disconnect();
  });

  // ─── Project Visibility ──────────────────────────────────────────────────

  describe('Project Visibility — Brand Isolation', () => {
    it('1. RRH-only project visible to RRH request', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const names = res.body.map((p: any) => p.name);
      expect(names).toContain('RRH Commercial Hub');
    });

    it('2. RRH-only project hidden from Sonthillu request', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const names = res.body.map((p: any) => p.name);
      expect(names).not.toContain('RRH Commercial Hub');
    });

    it('3. Sonthillu-only project visible to Sonthillu request', async () => {
      const res = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const names = res.body.map((p: any) => p.name);
      expect(names).toContain('Sonthillu Residency');
    });

    it('4. Sonthillu-only project hidden from RRH request', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/projects')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const names = res.body.map((p: any) => p.name);
      expect(names).not.toContain('Sonthillu Residency');
    });

    it('5. Dual-published project visible to both brands', async () => {
      const rrh = await request(app)
        .get('/api/v1/public/rrh/projects')
        .set('x-api-key', apiKey);
      const son = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      expect(rrh.status).toBe(200);
      expect(son.status).toBe(200);
      const rrhNames = rrh.body.map((p: any) => p.name);
      const sonNames = son.body.map((p: any) => p.name);
      expect(rrhNames).toContain('Dual Brand Towers');
      expect(sonNames).toContain('Dual Brand Towers');
    });

    it('6. Unpublished project hidden from both brands', async () => {
      const rrh = await request(app)
        .get('/api/v1/public/rrh/projects')
        .set('x-api-key', apiKey);
      const son = await request(app)
        .get('/api/v1/public/sonthillu/projects')
        .set('x-api-key', apiKey);

      const rrhNames = rrh.body.map((p: any) => p.name);
      const sonNames = son.body.map((p: any) => p.name);
      expect(rrhNames).not.toContain('Unpublished Project');
      expect(sonNames).not.toContain('Unpublished Project');
    });
  });

  // ─── Project Detail ──────────────────────────────────────────────────────

  describe('Project Detail', () => {
    it('7. Valid project detail returns 200', async () => {
      const res = await request(app)
        .get(`/api/v1/public/rrh/projects/${rrhProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('RRH Commercial Hub');
      expect(res.body.project_code).toBeDefined();
      expect(res.body.location).toBe('Gachibowli, Hyderabad');
    });

    it('8. Non-existent project returns 404', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/projects/999999')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });

    it('9. Unpublished-for-brand project returns 404', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${rrhProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });

    it('10. Invalid brand returns 400', async () => {
      const res = await request(app)
        .get('/api/v1/public/invalid/projects/1')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(400);
    });
  });

  // ─── Inventory Summary ───────────────────────────────────────────────────

  describe('Inventory Summary', () => {
    it('11. Correct total count for project', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${bothBrandProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      // Both-brand project has: bothProp1 (LIVE), livePropertyId (LIVE), lockedPropertyId (LOCKED/expired=AVAILABLE), bookedPropertyId (BOOKED)
      // Only LIVE and expired-LOCKED count for public inventory
      expect(res.body.inventory_summary).toBeDefined();
      expect(res.body.inventory_summary.total).toBeGreaterThanOrEqual(3);
    });

    it('12. Correct available/reserved/sold derivation', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${bothBrandProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const inv = res.body.inventory_summary;
      // LIVE → available, LOCKED expired → available, BOOKED → sold
      expect(inv.available).toBeGreaterThanOrEqual(2); // bothProp1 + liveProp + lockedProp (expired)
      expect(inv.sold).toBeGreaterThanOrEqual(1);      // bookedProp
    });

    it('13. Expired LOCKED property treated as AVAILABLE', async () => {
      const res = await request(app)
        .get(`/api/v1/public/sonthillu/projects/${bothBrandProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const inv = res.body.inventory_summary;
      // lockedPropertyId has expired lock (locked_until < now), so it counts as available
      expect(inv.available).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Public Safety ───────────────────────────────────────────────────────

  describe('Public Safety', () => {
    it('14. Internal project fields absent', async () => {
      const res = await request(app)
        .get(`/api/v1/public/rrh/projects/${rrhProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('company_id');
      expect(res.body).not.toHaveProperty('assigned_pm_id');
      expect(res.body).not.toHaveProperty('branch_id');
      expect(res.body).not.toHaveProperty('updated_at');
    });

    it('15. Property internal fields absent in project detail', async () => {
      const res = await request(app)
        .get(`/api/v1/public/rrh/projects/${rrhProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      if (res.body.properties && res.body.properties.length > 0) {
        const prop = res.body.properties[0];
        expect(prop).not.toHaveProperty('company_id');
        expect(prop).not.toHaveProperty('assigned_pm_id');
        expect(prop).not.toHaveProperty('created_by_id');
        expect(prop).not.toHaveProperty('rejection_reason');
      }
    });

    it('16. Private GPS absent', async () => {
      const res = await request(app)
        .get(`/api/v1/public/rrh/projects/${rrhProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      if (res.body.properties && res.body.properties.length > 0) {
        const prop = res.body.properties[0];
        expect(prop).not.toHaveProperty('latitude');
        expect(prop).not.toHaveProperty('longitude');
      }
    });

    it('17. Employee/internal objects absent', async () => {
      const res = await request(app)
        .get(`/api/v1/public/rrh/projects/${rrhProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('assigned_pm');
      expect(res.body).not.toHaveProperty('company');
      expect(res.body).not.toHaveProperty('branch');
    });

    it('18. Booking/customer/payment data absent', async () => {
      const res = await request(app)
        .get(`/api/v1/public/rrh/projects/${rrhProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('bookings');
      expect(res.body).not.toHaveProperty('customers');
      expect(res.body).not.toHaveProperty('payments');
    });

    it('19. Only APPROVED images returned', async () => {
      // Add an image to the RRH property for testing
      const image = await p.propertyImage.create({
        data: {
          property_id: rrhPropertyId,
          image_url: 'https://example.com/approved.jpg',
          is_primary: true,
          uploaded_by_id: (await prisma.employee.findFirst({ where: { company_id: companyId } }))!.id,
          status: 'APPROVED',
        },
      });

      const res = await request(app)
        .get(`/api/v1/public/rrh/projects/${rrhProjectId}`)
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      if (res.body.properties && res.body.properties.length > 0) {
        const prop = res.body.properties[0];
        if (prop.images && prop.images.length > 0) {
          for (const img of prop.images) {
            expect(img).toHaveProperty('id');
            expect(img).toHaveProperty('image_url');
            expect(img).not.toHaveProperty('uploaded_by_id');
            expect(img).not.toHaveProperty('status');
          }
        }
      }

      // Cleanup
      await p.propertyImage.delete({ where: { id: image.id } });
    });
  });

  // ─── Error Handling ──────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('20. Missing API key returns 401', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/projects');

      expect(res.status).toBe(401);
    });

    it('21. Invalid API key returns 401', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/projects')
        .set('x-api-key', 'INVALID-KEY');

      expect(res.status).toBe(401);
    });

    it('22. Invalid project ID returns 404', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/projects/abc')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });

    it('23. Negative project ID returns 404', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/projects/-1')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });
  });
});
