import { Roles } from '@rrh-ems/shared';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { jest } from '@jest/globals';

jest.setTimeout(30000);


const p = prisma as any;

describe('WR-2: Structured Property Data', () => {
  let mdToken: string;
  let companyId: number;
  let apiKey: string;
  let propertyIds: number[] = [];

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    companyId = (await prisma.employee.findFirst({ where: { employee_code: getCode(Roles.MD) } }))!.company_id;

    // Login as MD
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.2.100')
      .send({ employee_code: getCode(Roles.MD), password: 'Password@123' });
    mdToken = loginRes.body.accessToken;

    // Create test API key for public tests
    const testApiKey = `WR2-STRUCT-${Date.now()}`;
    await p.publicApiKey.create({
      data: { api_key: testApiKey, company_id: companyId, is_active: true },
    });
    apiKey = testApiKey;
  });

  afterAll(async () => {
    // Clean up in FK dependency order
    if (propertyIds.length > 0) {
      await p.propertyPublication.deleteMany({ where: { property_id: { in: propertyIds } } });
      await p.property.deleteMany({ where: { id: { in: propertyIds } } });
    }
    if (apiKey) {
      await p.publicApiKey.deleteMany({ where: { api_key: apiKey } });
    }
    await prisma.$disconnect();
  });

  describe('Location — Create, Read, Update', () => {
    let propId: number;

    it('1. Create property with structured location fields', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          title: 'WR2 Location Test Property',
          brand_type: 'SONTHILLU',
          category: 'APARTMENT',
          price: 15000000,
          area_sqft: 1800,
          location: 'Miyapur, Hyderabad',
          state: 'Telangana',
          city: 'Hyderabad',
          locality: 'Miyapur',
          pincode: '500049',
          latitude: 17.4933,
          longitude: 78.3944,
          listing_type: 'NEW',
        });

      expect(res.status).toBe(201);
      expect(res.body.property.state).toBe('Telangana');
      expect(res.body.property.city).toBe('Hyderabad');
      expect(res.body.property.locality).toBe('Miyapur');
      expect(res.body.property.pincode).toBe('500049');
      expect(res.body.property.latitude).toBeCloseTo(17.4933, 3);
      expect(res.body.property.longitude).toBeCloseTo(78.3944, 3);
      expect(res.body.property.listing_type).toBe('NEW');
      propId = res.body.property.id;
      propertyIds.push(propId);
    });

    it('2. Read property returns structured location fields', async () => {
      const res = await request(app)
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      const prop = res.body.properties.find((p: any) => p.id === propId);
      expect(prop).toBeDefined();
      expect(prop.state).toBe('Telangana');
      expect(prop.city).toBe('Hyderabad');
      expect(prop.locality).toBe('Miyapur');
      expect(prop.pincode).toBe('500049');
      expect(prop.listing_type).toBe('NEW');
    });

    it('3. Update property structured location fields', async () => {
      const res = await request(app)
        .put(`/api/v1/properties/${propId}`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          city: 'Secunderabad',
          locality: 'Trimulgherry',
          pincode: '500015',
        });

      expect(res.status).toBe(200);
      const updated = await p.property.findUnique({ where: { id: propId } });
      expect(updated.city).toBe('Secunderabad');
      expect(updated.locality).toBe('Trimulgherry');
      expect(updated.pincode).toBe('500015');
      // Unchanged fields preserved
      expect(updated.state).toBe('Telangana');
    });
  });

  describe('Listing Type — NEW / RESALE', () => {
    let newPropId: number;
    let resalePropId: number;

    it('4. Create property with listing_type NEW', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          title: 'WR2 New Listing',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 25000000,
          area_sqft: 3000,
          location: 'Gachibowli',
          listing_type: 'NEW',
        });

      expect(res.status).toBe(201);
      expect(res.body.property.listing_type).toBe('NEW');
      newPropId = res.body.property.id;
      propertyIds.push(newPropId);
    });

    it('5. Create property with listing_type RESALE', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          title: 'WR2 Resale Listing',
          brand_type: 'SONTHILLU',
          category: 'APARTMENT',
          price: 8000000,
          area_sqft: 1200,
          location: 'Kukatpally',
          listing_type: 'RESALE',
        });

      expect(res.status).toBe(201);
      expect(res.body.property.listing_type).toBe('RESALE');
      resalePropId = res.body.property.id;
      propertyIds.push(resalePropId);
    });

    it('6. Invalid listing_type is rejected by schema validation', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          title: 'WR2 Invalid Listing Type',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 10000000,
          area_sqft: 2000,
          location: 'Test',
          listing_type: 'INVALID_TYPE',
        });

      expect(res.status).toBe(400);
    });

    it('7. Default listing_type is NEW when omitted', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          title: 'WR2 Default Listing Type',
          brand_type: 'SONTHILLU',
          category: 'PLOT',
          price: 5000000,
          area_sqft: 1500,
          location: 'Test Location',
        });

      expect(res.status).toBe(201);
      expect(res.body.property.listing_type).toBe('NEW');
      propertyIds.push(res.body.property.id);
    });
  });

  describe('Amenities — Structured Representation', () => {
    let amenPropId: number;

    it('8. Create property with amenities text (backward compatible)', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          title: 'WR2 Amenities Test',
          brand_type: 'SONTHILLU',
          category: 'APARTMENT',
          price: 12000000,
          area_sqft: 1600,
          location: 'Madhapur',
          amenities: 'Gymnasium, Swimming Pool, 24/7 Security',
        });

      expect(res.status).toBe(201);
      expect(res.body.property.amenities).toBe('Gymnasium, Swimming Pool, 24/7 Security');
      amenPropId = res.body.property.id;
      propertyIds.push(amenPropId);
    });

    it('9. Update amenities text', async () => {
      const res = await request(app)
        .put(`/api/v1/properties/${amenPropId}`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          amenities: 'Gymnasium, Swimming Pool, 24/7 Security, Clubhouse, Power Backup',
        });

      expect(res.status).toBe(200);
      const updated = await p.property.findUnique({ where: { id: amenPropId } });
      expect(updated.amenities).toBe('Gymnasium, Swimming Pool, 24/7 Security, Clubhouse, Power Backup');
    });

    it('10. Amenities returned in public API response', async () => {
      // Publish the property first
      await p.property.update({ where: { id: amenPropId }, data: { status: 'LIVE' } });
      await p.propertyPublication.create({
        data: { property_id: amenPropId, company_id: companyId, is_published: true, published_at: new Date() },
      });

      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const prop = res.body.find((p: any) => p.id === amenPropId);
      expect(prop).toBeDefined();
      expect(prop.amenities).toBe('Gymnasium, Swimming Pool, 24/7 Security, Clubhouse, Power Backup');
    });
  });

  describe('GPS — Storage and Public Safety', () => {
    let gpsPropId: number;

    it('11. Store GPS coordinates (internal)', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          title: 'WR2 GPS Test',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 30000000,
          area_sqft: 4000,
          location: 'Jubilee Hills',
          latitude: 17.4156,
          longitude: 78.4347,
        });

      expect(res.status).toBe(201);
      expect(res.body.property.latitude).toBeCloseTo(17.4156, 3);
      expect(res.body.property.longitude).toBeCloseTo(78.4347, 3);
      gpsPropId = res.body.property.id;
      propertyIds.push(gpsPropId);
    });

    it('12. GPS coordinates are NOT exposed in public API', async () => {
      // Publish the property
      await p.property.update({ where: { id: gpsPropId }, data: { status: 'LIVE' } });
      await p.propertyPublication.create({
        data: { property_id: gpsPropId, company_id: companyId, is_published: true, published_at: new Date() },
      });

      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const prop = res.body.find((p: any) => p.id === gpsPropId);
      expect(prop).toBeDefined();
      expect(prop.latitude).toBeUndefined();
      expect(prop.longitude).toBeUndefined();
    });

    it('13. Update GPS coordinates', async () => {
      const res = await request(app)
        .put(`/api/v1/properties/${gpsPropId}`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          latitude: 17.4200,
          longitude: 78.4400,
        });

      expect(res.status).toBe(200);
      const updated = await p.property.findUnique({ where: { id: gpsPropId } });
      expect(updated.latitude).toBeCloseTo(17.4200, 3);
      expect(updated.longitude).toBeCloseTo(78.4400, 3);
    });
  });

  describe('Public API — Filtering', () => {
    let filterPropIds: number[] = [];

    beforeAll(async () => {
      // Create properties with different cities and listing types
      const props = [
        { title: 'Filter Hyderabad NEW', city: 'Hyderabad', locality: 'Miyapur', listing_type: 'NEW' as const },
        { title: 'Filter Hyderabad RESALE', city: 'Hyderabad', locality: 'Gachibowli', listing_type: 'RESALE' as const },
        { title: 'Filter Vijayawada NEW', city: 'Vijayawada', locality: 'Governorpet', listing_type: 'NEW' as const },
      ];

      for (const data of props) {
        const prop = await p.property.create({
          data: {
            property_code: `WR2-FILTER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            company_id: companyId,
            title: data.title,
            brand_type: 'SONTHILLU',
            category: 'APARTMENT',
            price: 10000000,
            area_sqft: 1500,
            location: 'Test',
            status: 'LIVE',
            city: data.city,
            locality: data.locality,
            listing_type: data.listing_type,
            created_by_id: (await prisma.employee.findFirst())!.id,
          },
        });
        filterPropIds.push(prop.id);
        propertyIds.push(prop.id);

        await p.propertyPublication.create({
          data: { property_id: prop.id, company_id: companyId, is_published: true, published_at: new Date() },
        });
      }
    });

    it('14. Filter by city', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties?city=Hyderabad')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const cities = res.body.map((p: any) => p.city);
      expect(cities.every((c: string) => c === 'Hyderabad')).toBe(true);
    });

    it('15. Filter by locality', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties?locality=Miyapur')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const localities = res.body.map((p: any) => p.locality);
      expect(localities.every((l: string) => l === 'Miyapur')).toBe(true);
    });

    it('16. Filter by listing_type', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties?listing_type=RESALE')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const types = res.body.map((p: any) => p.listing_type);
      expect(types.every((t: string) => t === 'RESALE')).toBe(true);
    });

    it('17. Filter by category', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties?category=APARTMENT')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const categories = res.body.map((p: any) => p.category);
      expect(categories.every((c: string) => c === 'APARTMENT')).toBe(true);
    });

    it('18. Combined filters (city + listing_type)', async () => {
      const res = await request(app)
        .get('/api/v1/public/rrh/properties?city=Hyderabad&listing_type=NEW')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      for (const prop of res.body) {
        expect(prop.city).toBe('Hyderabad');
        expect(prop.listing_type).toBe('NEW');
      }
    });
  });

  describe('Backward Compatibility', () => {
    let legacyPropId: number;

    it('19. Old property with null WR-2 fields still works via public API', async () => {
      // Create property without any WR-2 fields (simulates legacy record)
      const prop = await p.property.create({
        data: {
          property_code: `WR2-LEGACY-${Date.now()}`,
          company_id: companyId,
          title: 'Legacy Property (No WR-2 Fields)',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 20000000,
          area_sqft: 2500,
          location: 'Old Location',
          status: 'LIVE',
          created_by_id: (await prisma.employee.findFirst())!.id,
          // No state, city, locality, pincode, latitude, longitude, listing_type
        },
      });
      legacyPropId = prop.id;
      propertyIds.push(legacyPropId);

      await p.propertyPublication.create({
        data: { property_id: legacyPropId, company_id: companyId, is_published: true, published_at: new Date() },
      });

      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      const legacyProp = res.body.find((p: any) => p.id === legacyPropId);
      expect(legacyProp).toBeDefined();
      expect(legacyProp.state).toBeNull();
      expect(legacyProp.city).toBeNull();
      expect(legacyProp.locality).toBeNull();
      expect(legacyProp.listing_type).toBe('NEW'); // Default value
    });

    it('20. Old property with null WR-2 fields works via internal API', async () => {
      const res = await request(app)
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      const legacyProp = res.body.properties.find((p: any) => p.id === legacyPropId);
      expect(legacyProp).toBeDefined();
      expect(legacyProp.state).toBeNull();
      expect(legacyProp.city).toBeNull();
    });
  });

  describe('Company Isolation', () => {
    it('21. Company isolation — properties from other companies not visible', async () => {
      // The public API already filters by company via PropertyPublication
      // This test verifies the structured fields are also isolated
      const res = await request(app)
        .get('/api/v1/public/rrh/properties')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      // All returned properties should have our companyId's publications
      for (const prop of res.body) {
        const publication = await p.propertyPublication.findFirst({
          where: { property_id: prop.id, company_id: companyId, is_published: true },
        });
        expect(publication).not.toBeNull();
      }
    });
  });
});
