import { describe, expect, it, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { Roles } from '@rrh-ems/shared';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';



describe('Phase 4 - Authorization Architecture Consolidation & Mutation Hardening', () => {
  let mdToken: string;
  let adminToken: string;
  let tcOrg1Token: string;
  let tcOrg2Token: string;
  
  let tcOrg1Id: number;
  let tcOrg2Id: number;
  let mdId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }
    
    await setupDeterministicTestUsers();

    const getAuth = async (code: string, idx: number) => {
      const res = await request(app).post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.12.${idx}`)
        .send({
          employee_code: code,
          password: 'Password@123',
        });
      return res.body.accessToken;
    };

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    const tcOrg2Code = crossOrgUsers[0].employee_code;

    [mdToken, adminToken, tcOrg1Token, tcOrg2Token] = await Promise.all([
      getAuth(getCode(Roles.MD), 1),
      getAuth(getCode(Roles.ADMIN), 2),
      getAuth(getCode(Roles.TELECALLER), 3),
      getAuth(tcOrg2Code, 4)
    ]);

    const users = await prisma.employee.findMany({
      where: { employee_code: { in: [getCode(Roles.MD), getCode(Roles.TELECALLER), tcOrg2Code] } }
    });

    mdId = users.find(u => u.employee_code === getCode(Roles.MD))!.id;
    tcOrg1Id = users.find(u => u.employee_code === getCode(Roles.TELECALLER))!.id;
    tcOrg2Id = users.find(u => u.employee_code === tcOrg2Code)!.id;
  });

  describe('Employee PATCH IDOR & Privilege Escalation', () => {
    it('prevents employee from updating another employee in a different company (IDOR)', async () => {
      // tcOrg1 tries to update tcOrg2
      const res = await request(app)
        .patch(`/api/v1/employees/${tcOrg2Id}`)
        .set('Authorization', `Bearer ${tcOrg1Token}`)
        .send({ job_title: 'Hacked Title' });
      
      expect(res.status).toBe(403);
    });

    it('prevents employee from self-promoting to MD (Privilege Escalation)', async () => {
      // tcOrg1 tries to self-promote to MD
      const res = await request(app)
        .patch(`/api/v1/employees/${tcOrg1Id}`)
        .set('Authorization', `Bearer ${tcOrg1Token}`)
        .send({ role_name: Roles.MD });
      
      expect(res.status).toBe(403);
    });

    it('prevents non-Admin from assigning Admin roles', async () => {
      // MD tries to assign ADMIN role
      const res = await request(app)
        .patch(`/api/v1/employees/${tcOrg1Id}`)
        .set('Authorization', `Bearer ${mdToken}`)
        .send({ role_name: Roles.ADMIN });
      
      expect(res.status).toBe(403);
    });
  });

  describe('Employee Password Reset Boundaries', () => {
    it('prevents employee from resetting password of cross-company employee', async () => {
      // mdOrg1 tries to reset password of tcOrg2
      const res = await request(app)
        .post(`/api/v1/employees/${tcOrg2Id}/reset-password`)
        .set('Authorization', `Bearer ${mdToken}`);
      
      expect(res.status).toBe(403);
    });

    it('allows Admin to reset password of any employee', async () => {
      const res = await request(app)
        .post(`/api/v1/employees/${tcOrg2Id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
    });
  });

  describe('Lead Mutations Route Protection', () => {
    it('prevents lead creation without LEADS_CREATE permission', async () => {
      // Missing auth token
      const res = await request(app)
        .post('/api/v1/leads')
        .send({ customer_name: 'Test' });
        
      expect(res.status).toBe(401);
    });
  });


  describe('Phase 6 - Target & Admin Protections', () => {
    it('prevents MD from setting targets for an employee in another company', async () => {
      // MD (Org1) tries to set target for TC (Org2)
      const res = await request(app)
        .post('/api/v1/targets')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          role_name: Roles.TELECALLER,
          employee_id: tcOrg2Id,
          target_type: 'COUNT',
          targets_json: { callsMade: 100 }
        });
      
      expect(res.status).toBe(403);
    });

    it('prevents MD from viewing security alerts of another company', async () => {
      // We will just verify MD can hit the endpoint but gets 200 (filtered) or 403.
      // Since it's filtered, we expect a 200 with an array.
      const res = await request(app)
        .get('/api/v1/admin/security-alerts')
        .set('Authorization', `Bearer ${mdToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.alerts)).toBe(true);
      // Ensure no alert from tcOrg2Id is present
      const hasCrossCompanyAlert = res.body.alerts.some((a: any) => a.actor_id === tcOrg2Id);
      expect(hasCrossCompanyAlert).toBe(false);
    });
  });
});
