import request from 'supertest';
import app from '../../apps/api/src/server';
import { Roles } from '@rrh-ems/shared';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';

import { jest } from '@jest/globals';

jest.setTimeout(30000);


const p = prisma as any;

describe('Phase 5A - Site Visit Domain Baseline', () => {
  let mdToken: string;
  let pmAToken: string;
  let pmBToken: string;
  let pmOrgBToken: string;
  let dmToken: string;
  let tcToken: string;
  let agentToken: string;

  let tcId: number;
  let pmAId: number;
  let pmBId: number;
  let agentId: number;
  let companyId: number;

  let leadId: number;
  let propertyId: number;
  let visitAId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    // 0. Proactive cleanup
    await p.employee.deleteMany({
      where: { employee_code: { in: ['RRH-OP-998', 'RRH-OP-997', 'RRH-SL-996'] } }
    });
    // Delete stale test fixtures in correct FK-safe order
    await p.siteVisitProperty.deleteMany({ where: { property: { property_code: 'RRH-PR-TEST-SV' } } });
    await p.siteVisitBooking.deleteMany({ where: { OR: [{ booking_code: 'RRH-SV-SKIP-TEST' }, { property: { property_code: 'RRH-PR-TEST-SV' } }] } });
    await p.property.deleteMany({ where: { property_code: 'RRH-PR-TEST-SV' } });
    await p.project.deleteMany({ where: { project_code: 'RRH-PJ-TEST-SV' } });
    await p.lead.deleteMany({ where: { lead_code: 'RRH-L-TEST-SV' } });

    const getAuth = async (code: string, idx: number = 0) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.2.${idx}`) // Unique IP range to avoid rate limits
        .send({ employee_code: code, password: 'Password@123' });
      if (res.status !== 200) throw new Error(`Login failed for ${code}: ${res.text}`);
      return res.body.accessToken;
    };

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;

    const pmACode = getCode(Roles.PROJECT_MANAGER);
    const mdCode = getCode(Roles.MD);
    const tcCode = getCode(Roles.TELECALLER);

    companyId = (await p.employee.findFirst({ where: { employee_code: pmACode } })).company_id;
    tcId = (await p.employee.findFirst({ where: { employee_code: tcCode } })).id;
    pmAId = (await p.employee.findFirst({ where: { employee_code: pmACode } })).id;

    const pmAHash = (await p.employee.findFirst({ where: { employee_code: pmACode } })).password_hash;

    const pmB = await p.employee.upsert({
      where: { employee_code: 'RRH-OP-998' },
      update: { password_hash: pmAHash, status: 'ACTIVE', company_id: companyId },
      create: {
        employee_code: 'RRH-OP-998',
        full_name: 'SV PM B',
        password_hash: pmAHash,
        status: 'ACTIVE',
        company_id: companyId,
        roles: { create: { role: { connect: { name: Roles.PROJECT_MANAGER } } } }
      }
    });
    pmBId = pmB.id;

    const crossOrgCompanyId = (await p.employee.findFirst({ where: { employee_code: crossOrgUsers[0].employee_code } })).company_id;

    const pmOrgB = await p.employee.upsert({
      where: { employee_code: 'RRH-OP-997' },
      update: { password_hash: pmAHash, status: 'ACTIVE', company_id: crossOrgCompanyId },
      create: {
        employee_code: 'RRH-OP-997',
        full_name: 'SV PM Org B',
        password_hash: pmAHash,
        status: 'ACTIVE',
        company_id: crossOrgCompanyId,
        roles: { create: { role: { connect: { name: Roles.PROJECT_MANAGER } } } }
      }
    });

    const agentA = await p.employee.upsert({
      where: { employee_code: 'RRH-SL-996' },
      update: { password_hash: pmAHash, status: 'ACTIVE', company_id: companyId },
      create: {
        employee_code: 'RRH-SL-996',
        full_name: 'SV Agent A',
        password_hash: pmAHash,
        status: 'ACTIVE',
        company_id: companyId,
        roles: { create: { role: { connect: { name: Roles.AGENT } } } }
      }
    });
    agentId = agentA.id;

    [mdToken, pmAToken, pmBToken, pmOrgBToken, tcToken, agentToken] = await Promise.all([
      getAuth(mdCode, 1),
      getAuth(pmACode, 2),
      getAuth('RRH-OP-998', 3),
      getAuth('RRH-OP-997', 4),
      getAuth(tcCode, 5),
      getAuth('RRH-SL-996', 6),
    ]);

    console.log('pmOrgBToken Payload:', JSON.parse(Buffer.from(pmOrgBToken.split('.')[1], 'base64').toString()));
    console.log('agentToken Payload:', JSON.parse(Buffer.from(agentToken.split('.')[1], 'base64').toString()));

    const lead = await p.lead.upsert({
      where: { lead_code: 'RRH-L-TEST-SV' },
      update: {},
      create: {
        lead_code: 'RRH-L-TEST-SV',
        company: { connect: { id: companyId } },
        customer_name: 'SV Test Lead',
        phone: '9998887776',
        preferred_location: 'SV Location',
        status: 'NEW',
        assigned_to: { connect: { id: tcId } },
        created_by: { connect: { id: tcId } }
      }
    });
    leadId = lead.id;

    const project = await p.project.upsert({
      where: { project_code: 'RRH-PJ-TEST-SV' },
      update: { assigned_pm: { connect: { id: pmAId } }, status: 'ACTIVE' },
      create: {
        project_code: 'RRH-PJ-TEST-SV',
        company: { connect: { id: companyId } },
        name: 'SV Test Project',
        location: 'SV Location',
        assigned_pm: { connect: { id: pmAId } },
        status: 'ACTIVE'
      }
    });

    const property = await p.property.upsert({
      where: { property_code: 'RRH-PR-TEST-SV' },
      update: { project: { connect: { id: project.id } }, assigned_pm: { connect: { id: pmAId } }, status: 'LIVE' },
      create: {
        property_code: 'RRH-PR-TEST-SV',
        project: { connect: { id: project.id } },
        company: { connect: { id: companyId } },
        title: 'SV Test Property',
        brand_type: 'SONTHILLU',
        category: 'VILLA',
        price: 10000,
        area_sqft: 1000,
        location: 'SV Location',
        assigned_pm: { connect: { id: pmAId } },
        created_by: { connect: { id: pmAId } },
        status: 'LIVE'
      }
    });
    propertyId = property.id;
  });

  describe('1. Site Visit Creation', () => {
    it('Valid authorized actor (Telecaller) can create a site visit', async () => {
      const res = await request(app)
        .post('/api/v1/site-visits')
        .set('Authorization', `Bearer ${tcToken}`)
        .send({
          lead_id: leadId,
          property_ids: [propertyId],
          scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.booking.status).toBe('PENDING_ACCEPTANCE');
      expect(res.body.booking.project_manager_id).toBe(pmAId); // Auto-assigned correctly to property's PM
      visitAId = res.body.booking.id;
    });

    it('Phase 5B Hardened: Unauthorized user blocked from creating site visit', async () => {
      // Intended behavior: 403.
      const res = await request(app)
        .post('/api/v1/site-visits')
        .set('Authorization', `Bearer ${pmOrgBToken}`)
        .send({
          lead_id: leadId,
          scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        });
      
      expect(res.status).toBe(403);
    });
  });

  describe('2. Listing/Access Scope', () => {
    it('Phase 5B Hardened: Listing properties filters company scope correctly', async () => {
      const res = await request(app)
        .get('/api/v1/site-visits')
        .set('Authorization', `Bearer ${pmOrgBToken}`);
      
      if (res.status === 403) console.log('Listing properties 403 BODY:', res.body);
      expect(res.status).toBe(200);
      // Cross-company PM should NOT see visitAId
      expect(res.body.visits.some((v: any) => v.id === visitAId)).toBe(false);
    });
  });

  describe('3. Assignment/Ownership', () => {
    it('Phase 5B Hardened: Assignment is scoped correctly', async () => {
      // Create a separate booking for the reassignment test to avoid mutating visitAId
      const reassignRes = await request(app)
        .post('/api/v1/site-visits')
        .set('Authorization', `Bearer ${tcToken}`)
        .send({
          lead_id: leadId,
          property_ids: [propertyId],
          scheduled_date: new Date(Date.now() + 172800000).toISOString(),
        });
      expect(reassignRes.status).toBe(201);
      const reassignVisitId = reassignRes.body.booking.id;

      // Telecaller doesn't have site_visits.assign_agent permission
      const res = await request(app)
        .post(`/api/v1/site-visits/${reassignVisitId}/reassign`)
        .set('Authorization', `Bearer ${tcToken}`)
        .send({ to_employee_id: agentId, reason: 'Not authorized test' });
      
      expect(res.status).toBe(403);
      
      // PM from same company can reassign (visit is in PENDING_ACCEPTANCE)
      const res2 = await request(app)
        .post(`/api/v1/site-visits/${reassignVisitId}/reassign`)
        .set('Authorization', `Bearer ${pmAToken}`)
        .send({ to_employee_id: agentId, reason: 'Assigning to agent' });
        
      expect(res2.status).toBe(200);
    });
  });

  describe('4. Verification & Approval Actions', () => {
    it('Phase 5B Hardened: Cross-Company Actor blocked from verifying site visit', async () => {
      const res = await request(app)
        .post(`/api/v1/site-visits/${visitAId}/accept`)
        .set('Authorization', `Bearer ${pmOrgBToken}`)
        .send({ notes: 'Verified cross company' });
      
      expect(res.status).toBe(404);
    });
    it('Valid authorized actor can verify a site visit', async () => {
      const res = await request(app)
        .post(`/api/v1/site-visits/${visitAId}/accept`)
        .set('Authorization', `Bearer ${pmAToken}`) 
        .send({ notes: 'Verified' });
      
      expect(res.status).toBe(200);
    });
  });

  describe('5. Workflow Integrity (State Skipping & Out-of-Order)', () => {
    it('Phase 5B Hardened: Out-of-order transition blocked', async () => {
      const booking = await p.siteVisitBooking.upsert({
        where: { booking_code: 'RRH-SV-SKIP-TEST' },
        update: {
          assigned_agent: { connect: { id: agentId } },
          lead: { connect: { id: leadId } },
          status: 'PENDING_ACCEPTANCE'
        },
        create: {
          booking_code: 'RRH-SV-SKIP-TEST',
          lead: { connect: { id: leadId } },
          telecaller: { connect: { id: tcId } },
          assigned_agent: { connect: { id: agentId } },
          scheduled_date: new Date(),
          status: 'PENDING_ACCEPTANCE' // Initial state
        }
      });

      const res = await request(app)
        .post(`/api/v1/site-visits/${booking.id}/complete`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ outcomes: [{ property_id: propertyId, outcome: 'INTERESTED' }], feedback_notes: 'Skipped states' });
      
      if (res.status === 403) console.log('Complete visit 403 BODY:', res.body);
      expect(res.status).toBe(409); // Conflict - invalid transition
    });
  });
});
