import request from 'supertest';
import app from '../../apps/api/src/server';
import { Roles } from '@rrh-ems/shared';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

const prisma = new PrismaClient();
const p = prisma as any;

describe('WR-1 P0-1: Property Publication (Dual-Brand)', () => {
  let mdToken: string;
  let pmAToken: string;
  let pmBToken: string;
  let telecallerToken: string;
  let companyId: number;
  let propertyAId: number;
  let propertyBId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getAuth = async (code: string, idx: number = 0) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.2.${idx}`)
        .send({ employee_code: code, password: 'Password@123' });
      if (res.status !== 200) throw new Error(`Login failed for ${code}: ${res.text}`);
      return res.body.accessToken;
    };

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;

    companyId = (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } }))!.company_id;

    await prisma.branch.upsert({
      where: { id: 1 },
      update: { company_id: companyId },
      create: { id: 1, name: 'Main Branch', company_id: companyId },
    });

    [mdToken, pmAToken, telecallerToken] = await Promise.all([
      getAuth(getCode(Roles.MD), 1),
      getAuth(getCode(Roles.PROJECT_MANAGER), 2),
      getAuth(getCode(Roles.TELECALLER), 3),
    ]);

    // Create test properties
    const propA = await p.property.create({
      data: {
        property_code: `WR1-PROP-A-${Date.now()}`,
        company_id: companyId,
        title: 'Publication Test Property A',
        brand_type: 'SONTHILLU',
        category: 'VILLA',
        price: 15000000,
        area_sqft: 2500,
        location: 'Test Location',
        status: 'LIVE',
        created_by_id: (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.PROJECT_MANAGER) } }))!.id,
      },
    });
    propertyAId = propA.id;

    const propB = await p.property.create({
      data: {
        property_code: `WR1-PROP-B-${Date.now()}`,
        company_id: companyId,
        title: 'Publication Test Property B',
        brand_type: 'RADHA_REAL_HOMES',
        category: 'PLOT',
        price: 5000000,
        area_sqft: 1200,
        location: 'Test Location',
        status: 'LIVE',
        created_by_id: (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.PROJECT_MANAGER) } }))!.id,
      },
    });
    propertyBId = propB.id;
  });

  afterAll(async () => {
    // Clean up test data
    await p.propertyPublication.deleteMany({ where: { property_id: { in: [propertyAId, propertyBId] } } });
    await p.property.deleteMany({ where: { id: { in: [propertyAId, propertyBId] } } });
    await prisma.$disconnect();
  });

  describe('Publication Toggle', () => {
    it('can publish a property to the company', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${propertyAId}/publications`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ company_id: companyId, is_published: true });

      expect(res.status).toBe(200);
      expect(res.body.publication.is_published).toBe(true);
      expect(res.body.publication.company_id).toBe(companyId);
      expect(res.body.publication.property_id).toBe(propertyAId);
    });

    it('can unpublish a property', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${propertyAId}/publications`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ company_id: companyId, is_published: false });

      expect(res.status).toBe(200);
      expect(res.body.publication.is_published).toBe(false);
    });

    it('can publish to both brands (same company)', async () => {
      // Publish property A
      const resA = await request(app)
        .post(`/api/v1/properties/${propertyAId}/publications`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ company_id: companyId, is_published: true });

      expect(resA.status).toBe(200);
      expect(resA.body.publication.is_published).toBe(true);

      // Publish property B
      const resB = await request(app)
        .post(`/api/v1/properties/${propertyBId}/publications`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ company_id: companyId, is_published: true });

      expect(resB.status).toBe(200);
      expect(resB.body.publication.is_published).toBe(true);
    });

    it('can list publications for a property', async () => {
      const res = await request(app)
        .get(`/api/v1/properties/${propertyAId}/publications`)
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(res.body.publications).toBeDefined();
      expect(Array.isArray(res.body.publications)).toBe(true);
      expect(res.body.publications.length).toBeGreaterThanOrEqual(1);
      expect(res.body.publications[0].company).toBeDefined();
    });
  });

  describe('Authorization & Isolation', () => {
    it('telecaller cannot toggle publication (missing permission)', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${propertyAId}/publications`)
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({ company_id: companyId, is_published: true });

      expect(res.status).toBe(403);
    });

    it('cannot publish to a different company', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${propertyAId}/publications`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ company_id: 99999, is_published: true });

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent property', async () => {
      const res = await request(app)
        .post('/api/v1/properties/999999/publications')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ company_id: companyId, is_published: true });

      expect(res.status).toBe(404);
    });
  });

  describe('Idempotency', () => {
    it('upserts on duplicate property_id + company_id pair', async () => {
      // First publish
      const res1 = await request(app)
        .post(`/api/v1/properties/${propertyAId}/publications`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ company_id: companyId, is_published: true });

      expect(res1.status).toBe(200);
      const id1 = res1.body.publication.id;

      // Second publish (should upsert, not create duplicate)
      const res2 = await request(app)
        .post(`/api/v1/properties/${propertyAId}/publications`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ company_id: companyId, is_published: true });

      expect(res2.status).toBe(200);
      const id2 = res2.body.publication.id;

      // Same ID means upsert worked
      expect(id1).toBe(id2);
    });
  });
});
