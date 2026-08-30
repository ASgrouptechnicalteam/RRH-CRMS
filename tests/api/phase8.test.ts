import request from 'supertest';
import app from '../../apps/api/src/server';
import { Roles } from '@rrh-ems/shared';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';

import { jest } from '@jest/globals';

jest.setTimeout(30000);


const p = prisma as any;

describe('Phase 8 - CRM Core / Lead-to-Opportunity Domain Hardening', () => {
  let tcAToken: string;
  let tcBToken: string;

  let tcAId: number;
  let tcBId: number;
  let pmAId: number;
  let pmBId: number;

  let compAId: number;
  let compBId: number;

  let leadAId: number;
  let leadBId: number;
  let propAId: number;
  let propBId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    // Clean up specifically for this test
    await p.leadPropertyInterest.deleteMany({});
    await p.siteVisitBooking.deleteMany({ where: { booking_code: { startsWith: 'RRH-SV-P8' } } });
    await p.property.deleteMany({ where: { property_code: { in: ['RRH-PROP-P8A', 'RRH-PROP-P8B'] } } });
    await p.lead.deleteMany({ where: { lead_code: { in: ['RRH-L-P8A', 'RRH-L-P8B'] } } });

    const getAuth = async (code: string, idx: number = 0) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.8.${idx}`) // Unique IP range to avoid rate limits
        .send({ employee_code: code, password: 'Password@123' });
      if (res.status !== 200) throw new Error(`Login failed for ${code}: ${res.text}`);
      return res.body.accessToken;
    };

    const tcACode = deterministicUsers.find(u => u.roles.includes(Roles.TELECALLER))?.employee_code;
    const pmACode = deterministicUsers.find(u => u.roles.includes(Roles.PROJECT_MANAGER))?.employee_code;
    const tcBCode = crossOrgUsers.find(u => u.roles.includes(Roles.TELECALLER))?.employee_code;

    if (!tcACode || !pmACode || !tcBCode) {
      throw new Error('Deterministic users missing expected roles (TELECALLER, PROJECT_MANAGER) in Phase 8 setup.');
    }

    const tcA = await p.employee.findUnique({ where: { employee_code: tcACode } });
    const pmA = await p.employee.findUnique({ where: { employee_code: pmACode } });
    const tcB = await p.employee.findUnique({ where: { employee_code: tcBCode } });

    if (!tcA || !pmA || !tcB) {
      throw new Error('Deterministic employees not found in database for Phase 8 setup.');
    }

    compAId = tcA.company_id;
    compBId = tcB.company_id;

    // Manually create PM for Company B since it does not exist in crossOrgUsers
    const pmBCode = 'RRH-P8-PMB';
    const pmB = await p.employee.upsert({
      where: { employee_code: pmBCode },
      update: { status: 'ACTIVE', company_id: compBId, password_hash: tcA.password_hash },
      create: {
        employee_code: pmBCode,
        full_name: 'P8 PM B',
        password_hash: tcA.password_hash,
        status: 'ACTIVE',
        company_id: compBId,
        roles: { create: { role: { connect: { name: Roles.PROJECT_MANAGER } } } }
      }
    });

    tcAId = tcA.id;
    tcBId = tcB.id;
    pmAId = pmA.id;
    pmBId = pmB.id;

    tcAToken = await getAuth(tcACode, 1);
    tcBToken = await getAuth(tcBCode, 2);

    // Create Company A Lead and Property
    const leadA = await p.lead.create({
      data: {
        lead_code: 'RRH-L-P8A',
        company: { connect: { id: compAId } },
        customer_name: 'P8 Customer A',
        phone: '9998887771',
        created_by: { connect: { id: tcAId } },
        assigned_to: { connect: { id: tcAId } },
      }
    });
    leadAId = leadA.id;

    const propA = await p.property.create({
      data: {
        property_code: 'RRH-PROP-P8A',
        company: { connect: { id: compAId } },
        title: 'P8 Property A',
        price: 1500000,
        area_sqft: 1200,
        location: 'Hyderabad',
        created_by: { connect: { id: pmAId } },
        assigned_pm: { connect: { id: pmAId } },
        status: 'LIVE'
      }
    });
    propAId = propA.id;

    // Create Company B Lead and Property
    const leadB = await p.lead.create({
      data: {
        lead_code: 'RRH-L-P8B',
        company: { connect: { id: compBId } },
        customer_name: 'P8 Customer B',
        phone: '9998887772',
        created_by: { connect: { id: tcBId } },
        assigned_to: { connect: { id: tcBId } },
      }
    });
    leadBId = leadB.id;

    const propB = await p.property.create({
      data: {
        property_code: 'RRH-PROP-P8B',
        company: { connect: { id: compBId } },
        title: 'P8 Property B',
        price: 2500000,
        area_sqft: 1500,
        location: 'Bangalore',
        created_by: { connect: { id: pmBId } },
        assigned_pm: { connect: { id: pmBId } },
        status: 'LIVE'
      }
    });
    propBId = propB.id;
  });

  afterAll(async () => {
    await p.leadPropertyInterest.deleteMany({});
    await p.siteVisitBooking.deleteMany({ where: { booking_code: { startsWith: 'RRH-SV-P8' } } });
    await p.property.deleteMany({ where: { property_code: { in: ['RRH-PROP-P8A', 'RRH-PROP-P8B'] } } });
    await p.lead.deleteMany({ where: { lead_code: { in: ['RRH-L-P8A', 'RRH-L-P8B'] } } });
    await prisma.$disconnect();
  });

  describe('A. Property Interest Creation', () => {
    it('Authorized actor can associate a valid property with a lead', async () => {
      const res = await request(app)
        .post(`/api/v1/leads/${leadAId}/properties`)
        .set('Authorization', `Bearer ${tcAToken}`)
        .send({ property_id: propAId });
      
      expect(res.status).toBe(201);
      expect(res.body.interest.property_id).toBe(propAId);
    });

    it('Cross-Company Property Interest is REJECTED', async () => {
      const res = await request(app)
        .post(`/api/v1/leads/${leadAId}/properties`)
        .set('Authorization', `Bearer ${tcAToken}`)
        .send({ property_id: propBId });
      
      expect(res.status).toBe(404); // Invalid relation
    });
  });

  describe('B. Property Interest Retrieval and Isolation', () => {
    it('Company A actor can retrieve Company A Lead\'s property interests', async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${leadAId}/properties`)
        .set('Authorization', `Bearer ${tcAToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.interests).toBeDefined();
      expect(res.body.interests.length).toBeGreaterThan(0);
      expect(res.body.interests[0].property.id).toBe(propAId);
    });

    it('Company B actor CANNOT retrieve Company A Lead\'s property interests', async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${leadAId}/properties`)
        .set('Authorization', `Bearer ${tcBToken}`);
      
      expect(res.status).toBe(404);
    });
  });

  describe('C. Remove Property Interest', () => {
    it('Company B actor attempting to remove Company A Lead + Company A Property is REJECTED', async () => {
      const res = await request(app)
        .delete(`/api/v1/leads/${leadAId}/properties/${propAId}`)
        .set('Authorization', `Bearer ${tcBToken}`);
      
      expect(res.status).toBe(404);
    });

    it('Authorized same-company actor successfully removes interest', async () => {
      const res = await request(app)
        .delete(`/api/v1/leads/${leadAId}/properties/${propAId}`)
        .set('Authorization', `Bearer ${tcAToken}`);
      
      expect(res.status).toBe(200);
      
      // Verify it was deactivated
      const listRes = await request(app)
        .get(`/api/v1/leads/${leadAId}/properties`)
        .set('Authorization', `Bearer ${tcAToken}`);
      
      expect(listRes.body.interests.length).toBe(0);
    });
  });

  describe('D. Site Visit Booking Integrity', () => {
    it('Same-Company Lead + Property site visit booking is SUCCESSFUL', async () => {
      const res = await request(app)
        .post('/api/v1/site-visits')
        .set('Authorization', `Bearer ${tcAToken}`)
        .send({
          lead_id: leadAId,
          property_ids: [propAId],
          scheduled_date: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Test Phase 8 booking'
        });
      
      expect(res.status).toBe(201);
      
      // Keep it clean
      if (res.body.booking?.booking_code) {
        await p.siteVisitBooking.update({
          where: { id: res.body.booking.id },
          data: { booking_code: `RRH-SV-P8-VALID` }
        });
      }
    });

    it('Cross-Company Lead + Property site visit booking is REJECTED', async () => {
      const res = await request(app)
        .post('/api/v1/site-visits')
        .set('Authorization', `Bearer ${tcAToken}`)
        .send({
          lead_id: leadAId,
          property_ids: [propBId],
          scheduled_date: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Cross company attempt'
        });
      
      expect(res.status).toBe(404); // Invalid relation
    });
  });
});
