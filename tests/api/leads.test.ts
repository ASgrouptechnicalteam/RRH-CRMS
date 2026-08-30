import request from 'supertest';
import app from '../../apps/api/src/server';
import { Roles, Permissions } from '@rrh-ems/shared';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';



describe('Phase 3 - Lead Domain Extraction & Hardening', () => {
  let mdToken: string;
  let telecallerAToken: string;
  let telecallerBToken: string;
  let adminToken: string;
  
  let mdId: number;
  let telecallerAId: number;
  let telecallerBId: number;

  let testLeadAId: number;
  let testLeadA_Code: string;

  beforeAll(async () => {
    // 1. Reset test db safely
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }
    
    // 2. Setup deterministic users
    await setupDeterministicTestUsers();

    // 3. Authenticate as authoritative roles
    const getAuth = async (code: string, idx: number) => {
      const res = await request(app).post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.10.${idx}`)
        .send({
          employee_code: code,
          password: 'Password@123',
        });
      if (res.status !== 200) {
        console.error(`Login failed for ${code}: ${res.status}`, res.body);
      }
      return res.body.accessToken;
    };

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    const tcBCode = crossOrgUsers[0].employee_code;

    [mdToken, adminToken, telecallerAToken, telecallerBToken] = await Promise.all([
      getAuth(getCode(Roles.MD), 1),
      getAuth(getCode(Roles.ADMIN), 2),
      getAuth(getCode(Roles.TELECALLER), 3),
      getAuth(tcBCode, 4)
    ]);

    const users = await prisma.employee.findMany({
      where: { employee_code: { in: [getCode(Roles.MD), getCode(Roles.TELECALLER), tcBCode] } }
    });

    mdId = users.find(u => u.employee_code === getCode(Roles.MD))!.id;
    telecallerAId = users.find(u => u.employee_code === getCode(Roles.TELECALLER))!.id;
    telecallerBId = users.find(u => u.employee_code === tcBCode)!.id;
  });

  describe('Lead Creation & Assignment', () => {
    it('TC-A creates a lead and it is auto-assigned', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          customer_name: 'Test Lead IDOR Target',
          phone: `+919999${Date.now().toString().slice(-6)}`,
          source: 'MANUAL_ENTRY',
          notes: 'This lead is meant to test IDOR protections.'
        });

      expect(res.status).toBe(201);
      expect(res.body.lead).toBeDefined();
      expect(res.body.lead.customer_name).toBe('Test Lead IDOR Target');
      
      testLeadAId = res.body.lead.id;
      testLeadA_Code = res.body.lead.lead_code;

      // We explicitly bypass auto-assignment variability by manually assigning to TC-A for tests
      await prisma.lead.update({
        where: { id: testLeadAId },
        data: { assigned_to_id: telecallerAId, status: 'ASSIGNED' }
      });
    });
  });

  describe('Lead Scope & IDOR Protection', () => {
    it('TC-A can view their own assigned lead', async () => {
      const res = await request(app)
        .get('/api/v1/leads')
        .set('Authorization', `Bearer ${telecallerAToken}`);
      
      expect(res.status).toBe(200);
      const leads = res.body.leads;
      expect(leads.some((l: any) => l.id === testLeadAId)).toBe(true);
    });

    // IDOR EXPECTED TO FAIL CURRENTLY (We want it to return 403, but it will return 200)
    it('TC-B CANNOT update status of TC-A\'s lead (IDOR)', async () => {
      const res = await request(app)
        .patch(`/api/v1/leads/${testLeadAId}/status`)
        .set('Authorization', `Bearer ${telecallerBToken}`)
        .send({
          status: 'CONTACTED',
          notes: 'Hacked by TC-B'
        });

      // After refactoring, this MUST be 403 (or 404 since cross-tenant is invisible)
      expect(res.status).toBe(404);
    });

    it('TC-B CANNOT send WhatsApp proposal for TC-A\'s lead (IDOR)', async () => {
      // Need a dummy property first
      const testCompany = await prisma.company.findFirst();
      const prop = await prisma.property.create({
        data: {
          property_code: `PROP-${Date.now()}`,
          title: 'Dummy Prop',
          price: 10000,
          area_sqft: 1000,
          location: 'Test Location',
          created_by_id: mdId,
          company_id: testCompany!.id,
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          status: 'LIVE'
        }
      });

      const res = await request(app)
        .post(`/api/v1/leads/${testLeadAId}/whatsapp-proposal/${prop.id}`)
        .set('Authorization', `Bearer ${telecallerBToken}`);

      // After refactoring, this MUST be 403 (or 404)
      expect(res.status).toBe(404);
    });
  });

  describe('Lead Workflow Validation', () => {
    it('TC-A CAN update status with a valid workflow transition (ASSIGNED -> CONTACTED)', async () => {
      // Restore status to ASSIGNED in case TC-B IDOR succeeded
      await prisma.lead.update({ where: { id: testLeadAId }, data: { status: 'ASSIGNED' } });
      
      await prisma.leadActivity.create({
        data: {
          lead: { connect: { id: testLeadAId } },
          activity_type: 'CALL_LOGGED',
          notes: 'Test call',
          actor: { connect: { id: telecallerAId } }
        }
      });

      const res = await request(app)
        .patch(`/api/v1/leads/${testLeadAId}/status`)
        .set('Authorization', `Bearer ${telecallerAToken}`)
        .send({ status: 'CONTACTED', notes: 'Valid transition' });

      // If workflow logic is present, this should be 200
      expect(res.status).toBe(200);
    });

    // WORKFLOW EXPECTED TO FAIL CURRENTLY (We want it to return 409, but it will return 200)
    it('TC-A CANNOT skip lifecycle stages (e.g. CONTACTED directly to BOOKED without negotiation)', async () => {
      const res = await request(app)
        .patch(`/api/v1/leads/${testLeadAId}/status`)
        .set('Authorization', `Bearer ${telecallerAToken}`)
        .send({ status: 'BOOKED', notes: 'Skipping steps!' });

      // After refactoring, this MUST be 409 Conflict.
      // Currently, it will fail the test because the codebase is vulnerable (returns 200).
      expect(res.status).toBe(409);
    });
  });

  describe('Phase 2B - Lead Distribution Isolation', () => {
    let agentId: number;
    
    beforeAll(async () => {
      const users = await prisma.employee.findMany({
        where: { employee_code: { in: [deterministicUsers.find(u => u.roles[0] === Roles.AGENT)!.employee_code] } }
      });
      agentId = users[0].id;
    });

    it('should assign new leads exclusively to TELECALLER, ignoring AGENT even with zero load', async () => {
      // 1. Manually zero out Agent's load (just to be absolutely sure)
      await prisma.lead.updateMany({
        where: { assigned_to_id: agentId },
        data: { assigned_to_id: telecallerAId }
      });
      
      // 2. Create a new lead
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          customer_name: 'Phase 2B Distribution Test',
          phone: `+918888${Date.now().toString().slice(-6)}`,
          source: 'MANUAL_ENTRY'
        });
        
      expect(res.status).toBe(201);
      
      // 3. Assert it is NOT assigned to the Agent, but IS assigned to a Telecaller
      const assignedId = res.body.lead.assigned_to_id;
      expect(assignedId).toBeDefined();
      expect(assignedId).not.toBe(agentId);
      
      const assignee = await prisma.employee.findUnique({ where: { id: assignedId }, include: { roles: { include: { role: true } } } });
      const roleNames = assignee!.roles.map(r => r.role.name);
      expect(roleNames).toContain(Roles.TELECALLER);
      expect(roleNames).not.toContain(Roles.AGENT);
    });
    
    it('distribution monitor should exclude AGENT workloads entirely', async () => {
      const res = await request(app)
        .get('/api/v1/leads/distribution-monitor')
        .set('Authorization', `Bearer ${mdToken}`);
        
      expect(res.status).toBe(200);
      const telecallers = res.body.telecallers;
      
      // Assert that agent is NOT in the monitor array
      const agentInMonitor = telecallers.find((t: any) => t.id === agentId);
      expect(agentInMonitor).toBeUndefined();
    });
    
    it('should return null (safely unassigned NEW) if no TELECALLER exists, avoiding unsafe fallback', async () => {
      // Create a temporary isolated company with ONLY an AGENT (no telecallers)
      const isolatedCompany = await prisma.company.upsert({
        where: { code: 'ISO_COMP_2B' },
        update: {},
        create: { name: 'Isolated Company Phase 2B', code: 'ISO_COMP_2B' }
      });
      
      const isolatedAdmin = await prisma.employee.upsert({
        where: { employee_code: 'ISO-ADMIN' },
        update: { company_id: isolatedCompany.id },
        create: {
          employee_code: 'ISO-ADMIN',
          full_name: 'Isolated Admin',
          email: 'iso-admin@example.com',
          phone: '+918888888888',
          password_hash: 'hash',
          company_id: isolatedCompany.id,
          roles: { create: { role: { connect: { name: Roles.ADMIN } } } }
        }
      });
      
      const isolatedAgent = await prisma.employee.upsert({
        where: { employee_code: 'ISO-AGENT' },
        update: { company_id: isolatedCompany.id },
        create: {
          employee_code: 'ISO-AGENT',
          full_name: 'Isolated Agent',
          email: 'iso-agent@example.com',
          phone: '+918888888889',
          password_hash: 'hash',
          company_id: isolatedCompany.id,
          roles: { create: { role: { connect: { name: Roles.AGENT } } } }
        }
      });
      
      // Get isolated token
      const tokenPayload = {
        employeeId: isolatedAdmin.id,
        employeeCode: isolatedAdmin.employee_code,
        companyId: isolatedCompany.id,
        branchId: null,
        roles: [Roles.MD],
        permissions: [Permissions.LEADS_CREATE],
        tokenVersion: 1
      };
      
      const jwt = require('jsonwebtoken');
      const isoToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET);
      
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${isoToken}`)
        .send({
          customer_name: 'Isolated Target',
          phone: '+918888888811',
          source: 'MANUAL_ENTRY'
        });
        
      expect(res.status).toBe(201);
      
      // Without telecallers, lead should be safely NEW and unassigned.
      expect(res.body.lead.status).toBe('NEW');
      expect(res.body.lead.assigned_to_id).toBeNull();
      
      // Cleanup
      await prisma.leadActivity.deleteMany({ where: { lead_id: res.body.lead.id } });
      await prisma.lead.deleteMany({ where: { company_id: isolatedCompany.id } });
      await prisma.employeeRole.deleteMany({ where: { employee_id: { in: [isolatedAdmin.id, isolatedAgent.id] } } });
      await prisma.employee.deleteMany({ where: { company_id: isolatedCompany.id } });
      await prisma.company.delete({ where: { id: isolatedCompany.id } });
    });
  });
});
