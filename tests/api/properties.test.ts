import request from 'supertest';
import app from '../../apps/api/src/server';
import { Roles } from '@rrh-ems/shared';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';

import { jest } from '@jest/globals';

jest.setTimeout(30000); // Prevent hook timeout during DB setup and hashing

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 4 - Property Domain Extraction & Hardening Baseline', () => {
  let mdToken: string;
  let pmAToken: string;
  let pmBToken: string;
  let pmOrgBToken: string; // cross-company PM
  let dmToken: string;
  let telecallerToken: string;

  let pmAId: number;
  let pmBId: number;
  let companyId: number;

  let propertyAId: number; // created by/assigned to PM A

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getAuth = async (code: string, idx: number = 0) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.1.${idx}`) // bypass IP rate limit of 5 per IP
        .send({
          employee_code: code,
          password: 'Password@123',
        });
      if (res.status !== 200) {
        throw new Error(`Login failed for ${code}: ${res.text}`);
      }
      return res.body.accessToken;
    };

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;

    const pmACode = getCode(Roles.PROJECT_MANAGER);
    const mdCode = getCode(Roles.MD);
    const dmCode = getCode(Roles.DIGITAL_MARKETING_HEAD);
    const tcCode = getCode(Roles.TELECALLER);
    
    companyId = (await prisma.employee.findFirst({where:{employee_code: pmACode}}))!.company_id;

    // Ensure Branch 1 exists to satisfy the hardcoded fallback in the old routes/properties.ts
    await prisma.branch.upsert({
      where: { id: 1 },
      update: { company_id: companyId },
      create: { id: 1, name: 'Main Branch', company_id: companyId }
    });

    // Extract the hash from PM A so we don't have to spend 600ms bcrypting new passwords
    const pmAHash = (await prisma.employee.findFirst({where:{employee_code: pmACode}}))!.password_hash;

    const pmB = await prisma.employee.upsert({
      where: { employee_code: 'RRH-TST-998' },
      update: { password_hash: pmAHash, status: 'ACTIVE' },
      create: {
        employee_code: 'RRH-TST-998',
        full_name: 'PM B',
        password_hash: pmAHash,
        status: 'ACTIVE',
        company_id: companyId,
        roles: { create: { role: { connect: { name: Roles.PROJECT_MANAGER } } } }
      }
    });

    const pmOrgB = await prisma.employee.upsert({
      where: { employee_code: 'RRH-TST-997' },
      update: { password_hash: pmAHash, status: 'ACTIVE' },
      create: {
        employee_code: 'RRH-TST-997',
        full_name: 'PM Org B',
        password_hash: pmAHash,
        status: 'ACTIVE',
        company_id: (await prisma.employee.findFirst({where:{employee_code: crossOrgUsers[0].employee_code}}))!.company_id,
        roles: { create: { role: { connect: { name: Roles.PROJECT_MANAGER } } } }
      }
    });

    [mdToken, pmAToken, dmToken, telecallerToken, pmBToken, pmOrgBToken] = await Promise.all([
      getAuth(mdCode, 1),
      getAuth(pmACode, 2),
      getAuth(dmCode, 3),
      getAuth(tcCode, 4),
      getAuth('RRH-TST-998', 5),
      getAuth('RRH-TST-997', 6),
    ]);

    pmAId = (await prisma.employee.findFirst({where:{employee_code: pmACode}}))!.id;
    pmBId = pmB.id;
  });

  describe('Property Creation & Listing', () => {
    it('PM A can create a new property (PASSING BASELINE)', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${pmAToken}`)
        .send({
          title: 'Test Villa 1',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 15000000,
          area_sqft: 2500,
          location: 'Test Location',
          assigned_pm_id: pmAId,
        });

      expect(res.status).toBe(201);
      expect(res.body.property).toBeDefined();
      expect(res.body.property.status).toBe('PENDING_VERIFICATION');
      propertyAId = res.body.property.id;
    });

    it('Any authenticated user can create a property without roles (VULNERABILITY)', async () => {
      // Telecaller creating a property (should be blocked in hardened version if restricted)
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({
          title: 'Test Villa by TC',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 5000000,
          area_sqft: 1500,
          location: 'TC Location',
        });
      
      // After refactoring, this MUST be 403. Currently it succeeds (returns 201).
      expect(res.status).toBe(403);
    });

    it('Listing properties does not restrict to assigned PM (VULNERABILITY)', async () => {
      const res = await request(app)
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${pmBToken}`);
      
      expect(res.status).toBe(200);
      const properties = res.body.properties;
      // Expect false because PM B should NOT be able to list PM A's property (properly scoped listing)
      expect(properties.some((p: any) => p.id === propertyAId)).toBe(false);
    });
  });

  describe('Property PM Verification IDOR & State Vulnerabilities', () => {
    it('Unassigned PM (PM B) CAN verify PM A\'s property (IDOR VULNERABILITY)', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${propertyAId}/verify`)
        .set('Authorization', `Bearer ${pmBToken}`)
        .send({ approved: true, notes: 'Verified by wrong PM' });

      // After refactoring, this MUST be 403
      // Currently, it will fail the test because the codebase is vulnerable (returns 200).
      expect(res.status).toBe(403);
    });

    it('Cross-Company PM CAN verify Org A\'s property (IDOR VULNERABILITY)', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${propertyAId}/verify`)
        .set('Authorization', `Bearer ${pmOrgBToken}`)
        .send({ approved: true, notes: 'Verified by cross company PM' });

      // After refactoring, this MUST be 403 (Currently 200)
      expect(res.status).toBe(403);
    });
  });

  describe('Property Workflow State-Skipping Vulnerabilities', () => {
    it('DM Polish endpoint CAN be called out of order (WORKFLOW VULNERABILITY)', async () => {
      const skipCode1 = `TEST-SKIP-1-${Date.now()}`;
      const newProp = await p.property.create({
        data: {
          property_code: skipCode1,
          company_id: companyId,
          title: 'Skip Test',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 1, area_sqft: 1, location: 'Loc',
          status: 'PENDING_VERIFICATION',
          created_by_id: pmAId
        }
      });

      // DM Polish requires PENDING_VERIFICATION to be done first (should be PENDING_DM_POLISH)
      const res = await request(app)
        .post(`/api/v1/properties/${newProp.id}/dm-polish`)
        .set('Authorization', `Bearer ${dmToken}`)
        .send({ seo_title: 'SEO Title' });

      // After refactoring, this MUST be 409 Conflict.
      // Currently, returns 200.
      expect(res.status).toBe(409);
    });

    it('MD Approve endpoint CAN be called directly from NEW state (WORKFLOW VULNERABILITY)', async () => {
      const skipCode2 = `TEST-SKIP-2-${Date.now()}`;
      const newProp2 = await p.property.create({
        data: {
          property_code: skipCode2,
          company_id: companyId,
          title: 'Skip Test 2',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          price: 1, area_sqft: 1, location: 'Loc',
          status: 'PENDING_VERIFICATION',
          created_by_id: pmAId
        }
      });

      const res = await request(app)
        .post(`/api/v1/properties/${newProp2.id}/md-approve`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ approved: true, comments: 'Skipped to end' });

      // After refactoring, this MUST be 409 Conflict.
      // Currently, returns 200.
      expect(res.status).toBe(409);
    });
  });
  
  describe('Valid Workflow Completion', () => {
    it('Can complete the 3-stage approval properly (PASSING BASELINE)', async () => {
      const pId = propertyAId;
      
      // Fix state back to PENDING_VERIFICATION to test full flow
      await p.property.update({ where: { id: pId }, data: { status: 'PENDING_VERIFICATION' } });

      // 1. PM Verifies
      const verRes = await request(app)
        .post(`/api/v1/properties/${pId}/verify`)
        .set('Authorization', `Bearer ${pmAToken}`)
        .send({ approved: true, notes: 'Good' });
      
      expect(verRes.status).toBe(200);

      // 2. DM Polishes
      const dmRes = await request(app)
        .post(`/api/v1/properties/${pId}/dm-polish`)
        .set('Authorization', `Bearer ${dmToken}`)
        .send({ seo_title: 'Polished', seo_keywords: 'test' });
      
      expect(dmRes.status).toBe(200);

      // 3. MD Approves
      const mdRes = await request(app)
        .post(`/api/v1/properties/${pId}/md-approve`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ approved: true, comments: 'Looks good' });
      
      expect(mdRes.status).toBe(200);
      expect(mdRes.body.property.status).toBe('LIVE');
    });
  });
});
