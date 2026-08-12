import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken } from '../../apps/api/src/utils/jwt';
import { Roles, Permissions } from '@rrh-ems/shared';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';

const prisma = new PrismaClient();
const p = prisma as any;

describe('Phase 2 Security & Authorization Hardening', () => {
  let rrhAgentToken: string;
  let sontAgentToken: string;
  let rrhAgentId: number;
  let sontAgentId: number;
  let rrhPropertyId: number;
  let rrhLeadId: number;
  let rrhVisitId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    // Clean up specifically for this test
    await p.siteVisitBooking.deleteMany({ where: { booking_code: 'SEC-VISIT-01' } });
    await p.property.deleteMany({ where: { property_code: { in: ['RRH-PROP-SEC-01', 'RRH-PROP-SEC-02'] } } });
    await p.lead.deleteMany({ where: { lead_code: 'RRH-SEC-LEAD' } });

    const rrhAgentCode = deterministicUsers.find(u => u.roles.includes(Roles.AGENT))?.employee_code;
    const rrhAgent = await p.employee.findUnique({ where: { employee_code: rrhAgentCode } });
    
    if (!rrhAgent) {
      throw new Error('Deterministic RRH AGENT not found');
    }

    const tcBCode = crossOrgUsers.find(u => u.roles.includes(Roles.TELECALLER))?.employee_code;
    const tcB = await p.employee.findUnique({ where: { employee_code: tcBCode } });

    if (!tcB) {
      throw new Error('Deterministic Cross Org user not found');
    }

    // Create SONT Agent (Company 2) manually
    const sontAgentCode = 'SONT-SEC-AGENT';
    const sontAgent = await p.employee.upsert({
      where: { employee_code: sontAgentCode },
      update: { status: 'ACTIVE', company_id: tcB.company_id, password_hash: rrhAgent.password_hash },
      create: {
        employee_code: sontAgentCode,
        full_name: 'SONT Security Agent',
        password_hash: rrhAgent.password_hash,
        status: 'ACTIVE',
        company_id: tcB.company_id,
        roles: { create: { role: { connect: { name: Roles.AGENT } } } }
      }
    });

    rrhAgentId = rrhAgent.id;
    sontAgentId = sontAgent.id;

    rrhAgentToken = generateAccessToken({
      employeeId: rrhAgentId,
      employeeCode: rrhAgent.employee_code,
      companyId: rrhAgent.company_id,
      branchId: null as any,
      roles: [Roles.AGENT],
      permissions: [Permissions.SITE_VISITS_COMPLETE, Permissions.SITE_VISITS_READ, Permissions.EMPLOYEES_READ],
    });

    sontAgentToken = generateAccessToken({
      employeeId: sontAgentId,
      employeeCode: sontAgent.employee_code,
      companyId: sontAgent.company_id,
      branchId: null as any,
      roles: [Roles.AGENT],
      permissions: [Permissions.SITE_VISITS_COMPLETE, Permissions.SITE_VISITS_READ],
    });

    // Create RRH Property
    const propRRH = await p.property.create({
      data: {
        property_code: 'RRH-PROP-SEC-01',
        company: { connect: { id: rrhAgent.company_id } },
        title: 'Security Test Property RRH',
        price: 1000000,
        area_sqft: 1000,
        location: 'Hyderabad',
        created_by: { connect: { id: rrhAgentId } },
        status: 'LIVE'
      }
    });
    rrhPropertyId = propRRH.id;

    // Create SONT Property
    await p.property.create({
      data: {
        property_code: 'RRH-PROP-SEC-02',
        company: { connect: { id: sontAgent.company_id } },
        title: 'Security Test Property SONT',
        price: 1500000,
        area_sqft: 1200,
        location: 'Bangalore',
        created_by: { connect: { id: sontAgentId } },
        status: 'LIVE'
      }
    });

    // Create a Lead and Site Visit for RRH Agent
    const lead = await p.lead.create({
      data: {
        lead_code: 'RRH-SEC-LEAD',
        company: { connect: { id: rrhAgent.company_id } },
        customer_name: 'Security Test Lead',
        phone: '9999999999',
        created_by: { connect: { id: rrhAgentId } },
        assigned_to: { connect: { id: rrhAgentId } },
      }
    });
    rrhLeadId = lead.id;

    const visit = await p.siteVisitBooking.create({
      data: {
        booking_code: 'SEC-VISIT-01',
        lead_id: rrhLeadId,
        property_id: rrhPropertyId,
        telecaller_id: rrhAgentId,
        assigned_agent_id: rrhAgentId,
        status: 'SCHEDULED',
        scheduled_date: new Date(Date.now() + 86400000),
      }
    });
    rrhVisitId = visit.id;
  });

  describe('Tenant Isolation', () => {
    it('should deny Sonthillu Agent from completing RRH Site Visit', async () => {
      const res = await request(app)
        .post(`/api/v1/site-visits/${rrhVisitId}/complete`)
        .set('Authorization', `Bearer ${sontAgentToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });
  });

  describe('Ownership Enforcement', () => {
    it('should deny RRH Agent from completing a visit assigned to someone else', async () => {
      // Reassign visit to a different RRH user
      const pmCode = deterministicUsers.find(u => u.roles.includes(Roles.PROJECT_MANAGER))?.employee_code;
      const otherRRHUser = await p.employee.findUnique({ where: { employee_code: pmCode } });
      
      await p.siteVisitBooking.update({
        where: { id: rrhVisitId },
        data: { assigned_agent_id: otherRRHUser.id } // Removed from rrhAgentId
      });

      const res = await request(app)
        .post(`/api/v1/site-visits/${rrhVisitId}/complete`)
        .set('Authorization', `Bearer ${rrhAgentToken}`)
        .send({ status: 'COMPLETED' });

      // Ownership enforcement in siteVisit.policy.ts -> canComplete -> requires assigned_agent_id === user.employeeId
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');

      // Revert assignment
      await p.siteVisitBooking.update({
        where: { id: rrhVisitId },
        data: { assigned_agent_id: rrhAgentId }
      });
    });
  });

  describe('Sensitive Data Protection', () => {
    it('should mask PAN and sensitive fields on GET /employees for users without VIEW_SENSITIVE permission', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${rrhAgentToken}`);

      expect(res.status).toBe(200);
      const employees = res.body.employees;
      expect(employees.length).toBeGreaterThan(0);
      
      // Since rrhAgentToken does not have EMPLOYEES_VIEW_SENSITIVE, PAN should be absent
      employees.forEach((emp: any) => {
        expect(emp.panNumber).toBeUndefined();
        expect(emp.salaryCtc).toBeUndefined();
      });
    });
  });
});
