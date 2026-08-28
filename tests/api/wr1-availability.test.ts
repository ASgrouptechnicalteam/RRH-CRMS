import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { deriveAvailability } from '../../apps/api/src/services/property.service';
import { jest } from '@jest/globals';

jest.setTimeout(30000);


const p = prisma as any;

describe('WR-1 P0-3: Availability Derivation', () => {
  describe('deriveAvailability() unit tests', () => {
    it('LIVE property -> AVAILABLE', () => {
      expect(deriveAvailability({ status: 'LIVE', locked_until: null })).toBe('AVAILABLE');
    });

    it('LOCKED property with active lock -> RESERVED', () => {
      const future = new Date(Date.now() + 3600 * 1000);
      expect(deriveAvailability({ status: 'LOCKED', locked_until: future })).toBe('RESERVED');
    });

    it('LOCKED property with expired lock -> AVAILABLE', () => {
      const past = new Date(Date.now() - 3600 * 1000);
      expect(deriveAvailability({ status: 'LOCKED', locked_until: past })).toBe('AVAILABLE');
    });

    it('BOOKED property -> SOLD', () => {
      expect(deriveAvailability({ status: 'BOOKED', locked_until: null })).toBe('SOLD');
    });

    it('SOLD property -> SOLD', () => {
      expect(deriveAvailability({ status: 'SOLD', locked_until: null })).toBe('SOLD');
    });

    it('PENDING_VERIFICATION property -> UNAVAILABLE', () => {
      expect(deriveAvailability({ status: 'PENDING_VERIFICATION', locked_until: null })).toBe('UNAVAILABLE');
    });

    it('PENDING_DM_POLISH property -> UNAVAILABLE', () => {
      expect(deriveAvailability({ status: 'PENDING_DM_POLISH', locked_until: null })).toBe('UNAVAILABLE');
    });

    it('PENDING_MD_APPROVAL property -> UNAVAILABLE', () => {
      expect(deriveAvailability({ status: 'PENDING_MD_APPROVAL', locked_until: null })).toBe('UNAVAILABLE');
    });

    it('REJECTED property -> UNAVAILABLE', () => {
      expect(deriveAvailability({ status: 'REJECTED', locked_until: null })).toBe('UNAVAILABLE');
    });
  });

  describe('Public API availability filtering', () => {
    let apiKey: string;
    let companyId: number;
    let livePropId: number;
    let lockedPropId: number;
    let expiredLockPropId: number;
    let bookedPropId: number;

    beforeAll(async () => {
      if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
        throw new Error('Safety check failed: tests must run against isolated test database.');
      }

      await setupDeterministicTestUsers();

      const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
      companyId = (await prisma.employee.findFirst({ where: { employee_code: getCode('Managing director') } }))!.company_id;

      // Create test API key
      const testApiKey = `WR1-AVAIL-${Date.now()}`;
      await p.publicApiKey.create({
        data: { api_key: testApiKey, company_id: companyId, is_active: true },
      });
      apiKey = testApiKey;

      const makeProp = async (status: string, override: any = {}) => {
        const prop = await p.property.create({
          data: {
            property_code: `WR1-AVAIL-${status}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            company_id: companyId,
            title: `Availability Test - ${status}`,
            brand_type: 'SONTHILLU',
            category: 'VILLA',
            price: 10000000,
            area_sqft: 2000,
            location: 'Test Location',
            status,
            created_by_id: 1,
            ...override,
          },
        });
        return prop.id;
      };

      livePropId = await makeProp('LIVE');
      lockedPropId = await makeProp('LOCKED', { locked_until: new Date(Date.now() + 3600000) });
      expiredLockPropId = await makeProp('LOCKED', { locked_until: new Date(Date.now() - 3600000) });
      bookedPropId = await makeProp('BOOKED');

      // Publish all properties
      for (const pid of [livePropId, lockedPropId, expiredLockPropId, bookedPropId]) {
        await p.propertyPublication.create({
          data: { property_id: pid, company_id: companyId, is_published: true, published_at: new Date() },
        });
      }
    });

    afterAll(async () => {
      await p.propertyPublication.deleteMany({
        where: { property_id: { in: [livePropId, lockedPropId, expiredLockPropId, bookedPropId] } },
      });
      await p.property.deleteMany({
        where: { id: { in: [livePropId, lockedPropId, expiredLockPropId, bookedPropId] } },
      });
      await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
      await prisma.$disconnect();
    });

    it('LIVE properties appear in public listing', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).toContain(livePropId);
    });

    it('LOCKED properties with active lock do NOT appear', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).not.toContain(lockedPropId);
    });

    it('LOCKED properties with expired lock DO appear (available)', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).toContain(expiredLockPropId);
    });

    it('BOOKED properties do NOT appear', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).not.toContain(bookedPropId);
    });
  });
});
