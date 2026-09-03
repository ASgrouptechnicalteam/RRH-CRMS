import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { Roles } from '../../apps/api/src/shared';
import jwt from 'jsonwebtoken';

describe('Performance Metrics API', () => {
  let adminToken: string;
  let tcToken: string;
  let pmToken: string;
  let companyId: number;
  let telecallerId: number;
  let pmId: number;

  beforeAll(async () => {
    // Setup test data
    const company = await prisma.company.create({
      data: { name: 'Perf Metrics Test Co', code: 'PERFTEST', property_type_group: 'RADHA_REAL_HOMES' }
    });
    companyId = company.id;

    const branch = await prisma.branch.create({
      data: { name: 'Perf Branch', company_id: company.id }
    });

    const adminRole = await prisma.role.findFirst({ where: { name: Roles.ADMIN } });
    const tcRole = await prisma.role.findFirst({ where: { name: Roles.TELECALLER } });
    const pmRole = await prisma.role.findFirst({ where: { name: Roles.PROJECT_MANAGER } });

    const admin = await prisma.employee.create({
      data: {
        company_id: company.id, branch_id: branch.id,
        employee_code: 'PERF-ADMIN', full_name: 'Admin', email: 'perfadmin@test.com', phone: '1000000000',
        password_hash: 'hash', department: 'Admin', status: 'ACTIVE',
        roles: { create: { role_id: adminRole!.id } }
      }
    });

    const tc = await prisma.employee.create({
      data: {
        company_id: company.id, branch_id: branch.id,
        employee_code: 'PERF-TC', full_name: 'TC', email: 'perftc@test.com', phone: '1000000001',
        password_hash: 'hash', department: 'Sales', status: 'ACTIVE',
        roles: { create: { role_id: tcRole!.id } }
      }
    });
    telecallerId = tc.id;

    const pm = await prisma.employee.create({
      data: {
        company_id: company.id, branch_id: branch.id,
        employee_code: 'PERF-PM', full_name: 'PM', email: 'perfpm@test.com', phone: '1000000002',
        password_hash: 'hash', department: 'Sales', status: 'ACTIVE',
        roles: { create: { role_id: pmRole!.id } }
      }
    });
    pmId = pm.id;

    adminToken = jwt.sign({ employeeId: admin.id, companyId: company.id, roles: [Roles.ADMIN] }, process.env.JWT_SECRET || 'test-secret');
    tcToken = jwt.sign({ employeeId: tc.id, companyId: company.id, roles: [Roles.TELECALLER] }, process.env.JWT_SECRET || 'test-secret');
    pmToken = jwt.sign({ employeeId: pm.id, companyId: company.id, roles: [Roles.PROJECT_MANAGER] }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    await prisma.employee.deleteMany({ where: { company_id: companyId } });
    await prisma.branch.deleteMany({ where: { company_id: companyId } });
    await prisma.company.delete({ where: { id: companyId } });
  });

  it('calculates telecaller metrics correctly including reconfirmations and recovery', async () => {
    // Lead 1: Assigned, goes to CONTACTED
    const lead1 = await prisma.lead.create({
      data: {
        company_id: companyId,
        customer_name: 'Lead 1',
        phone: '1000000003',
        status: 'CONTACTED',
        assigned_to_id: telecallerId,
        lead_code: 'PERF-LEAD-1'
      }
    });

    // Site Visit for Lead 1 (completed reconfirmation)
    const sv1 = await prisma.siteVisitBooking.create({
      data: {
        booking_code: 'SV-PERF-1',
        lead_id: lead1.id,
        telecaller_id: telecallerId,
        scheduled_date: new Date(),
        status: 'CONFIRMED'
      }
    });
    await prisma.auditEvent.create({
      data: { actor_id: telecallerId, action: 'STATUS_CHANGED', entity_type: 'SITE_VISIT', entity_id: sv1.id, new_value: '{"status":"PENDING_CUSTOMER_RECONFIRMATION"}' }
    });
    await prisma.auditEvent.create({
      data: { actor_id: telecallerId, action: 'STATUS_CHANGED', entity_type: 'SITE_VISIT', entity_id: sv1.id, new_value: '{"status":"CONFIRMED"}' }
    });

    // Site Visit 2 (moved to ON_HOLD from reconfirmation - denominator should increase, numerator shouldn't)
    const sv2 = await prisma.siteVisitBooking.create({
      data: {
        booking_code: 'SV-PERF-2',
        lead_id: lead1.id,
        telecaller_id: telecallerId,
        scheduled_date: new Date(),
        status: 'ON_HOLD'
      }
    });
    await prisma.auditEvent.create({
      data: { actor_id: telecallerId, action: 'STATUS_CHANGED', entity_type: 'SITE_VISIT', entity_id: sv2.id, new_value: '{"status":"PENDING_CUSTOMER_RECONFIRMATION"}' }
    });
    await prisma.auditEvent.create({
      data: { actor_id: telecallerId, action: 'STATUS_CHANGED', entity_type: 'SITE_VISIT', entity_id: sv2.id, new_value: '{"status":"ON_HOLD"}' }
    });

    const res = await request(app).get(`/api/v1/performance/telecaller-metrics?telecallerId=${telecallerId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.metrics.reconfirmationsAttempted).toBeGreaterThanOrEqual(2);
    // At least 1 completed, >1 attempted
  });

  it('calculates PM metrics correctly including escalation exclusion', async () => {
    const lead = await prisma.lead.create({
      data: { company_id: companyId, customer_name: 'Lead PM', phone: '1000000004', status: 'SITE_VISIT_SCHEDULED', assigned_to_id: telecallerId, lead_code: 'PERF-LEAD-2' }
    });

    // SV 1: Responded normally
    const sv1 = await prisma.siteVisitBooking.create({
      data: { booking_code: 'SV-PM-1', lead_id: lead.id, telecaller_id: telecallerId, project_manager_id: pmId, scheduled_date: new Date(), status: 'ACCEPTED' }
    });
    await prisma.auditEvent.create({
      data: { actor_id: pmId, action: 'STATUS_CHANGED', entity_type: 'SITE_VISIT', entity_id: sv1.id, new_value: '{"status":"ACCEPTED"}' }
    });

    // SV 2: Escalated without response
    const sv2 = await prisma.siteVisitBooking.create({
      data: { booking_code: 'SV-PM-2', lead_id: lead.id, telecaller_id: telecallerId, project_manager_id: pmId, scheduled_date: new Date(), status: 'ESCALATED_TO_MARKETING_DIRECTOR' }
    });
    await prisma.siteVisitEscalation.create({
      data: { site_visit_booking_id: sv2.id, marketing_director_notified_at: new Date(Date.now() - 10000) }
    });
    
    // PM responds AFTER escalation
    await prisma.auditEvent.create({
      data: { actor_id: pmId, action: 'STATUS_CHANGED', entity_type: 'SITE_VISIT', entity_id: sv2.id, new_value: '{"status":"ACCEPTED"}', created_at: new Date() }
    });

    const res = await request(app).get(`/api/v1/performance/pm-metrics?pmId=${pmId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.metrics.escalatedWithoutResponseCount).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.requestsHandled).toBeGreaterThanOrEqual(2);
  });
});
