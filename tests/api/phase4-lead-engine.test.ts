import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';

const prisma = new PrismaClient();

describe('Phase 4 - Lead Management Engine', () => {
  let telecallerToken: string;
  let companyId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    
    // 1. Find a valid telecaller token from test_db setup
    const telecaller = await prisma.employee.findFirst({
      where: { employee_code: 'RRH-TST-000' } // MD from testUsers.ts has LEADS_CREATE
    });

    if (!telecaller) throw new Error("Telecaller not found for tests");
    companyId = telecaller.company_id;

    const authRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.10.5')
      .send({
        employee_code: telecaller.employee_code,
        password: 'Password@123'
      });
    telecallerToken = authRes.body.token || authRes.body.accessToken;
  });

  afterAll(async () => {
    const testPhone = '9988776655';
    const testLead = await prisma.lead.findFirst({ where: { phone: testPhone } });
    if (testLead) {
      await prisma.task.deleteMany({ where: { lead_id: testLead.id } });
      await prisma.leadActivity.deleteMany({ where: { lead_id: testLead.id } });
      await prisma.lead.delete({ where: { id: testLead.id } });
    }
    await prisma.$disconnect();
  });

  describe('Duplicate Detection & Lead Score & UTM', () => {
    const testPhone = '9988776655';

    it('creates a new lead and calculates lead score with UTM/Campaign', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({
          customer_name: 'Test Lead Phase 4',
          phone: testPhone,
          email: 'testp4@example.com',
          source: 'WEBSITE',
          budget_min: 5000000,
          budget_max: 7000000,
          campaign: 'Summer Sale 2026',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'summer_sale'
        });

      expect(res.status).toBe(201);
      expect(res.body.lead).toBeDefined();
      expect(res.body.lead.lead_code).toBeDefined();
      
      // Score calculation:
      // WEBSITE = +10
      // Email = +10
      // Budget = +15
      // Total = 35
      expect(res.body.lead.lead_score).toBe(35); // 10 + 20 + 5 + 5 or something
      expect(res.body.lead.utm_source).toBe('google');
      expect(res.body.lead.utm_medium).toBe('cpc');
      expect(res.body.lead.campaign).toBe('Summer Sale 2026');
      expect(res.body.lead.sla_breach_at).toBeDefined();
    });

    it('rejects duplicate lead with same phone (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({
          customer_name: 'Duplicate Test Lead',
          phone: testPhone, // Same phone
          source: 'MANUAL_ENTRY'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Duplicate lead detected');
    });

    it('allows follow-up task creation linked to lead', async () => {
      const lead = await prisma.lead.findFirst({ where: { phone: testPhone }});
      
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({
          title: 'Follow up call for Phase 4',
          assignee_id: lead!.created_by_id, // assign to self
          priority: 'HIGH',
          deadline: new Date(Date.now() + 86400000).toISOString(),
          lead_id: lead!.id
        });

      expect(res.status).toBe(201);
      expect(res.body.task.lead_id).toBe(lead!.id);
    });
  });
});
