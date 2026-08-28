/**
 * Phase 16 V1 — Packet B: Unified Analytics API integration tests.
 *
 * READ-ONLY verification of the centralized analytics KPI service and the
 * permission-gated, company-isolated /api/v1/analytics/kpis endpoint.
 *
 * Coverage (DB-backed, test_db):
 *  1. Authentication gate          -> 401 without a token
 *  2. Authorization gate            -> 403 without ADMIN_SYSTEM_METRICS
 *  3. KPI correctness               -> hand-computed values from a seeded dataset
 *  4. Company isolation             -> Company B data cannot bleed into A
 *  5. Empty dataset                 -> safe zero/empty results, no NPE/NaN
 *
 * Company scope is ALWAYS derived from the authenticated JWT; the client never
 * supplies a companyId. Each test uses its own isolated company so assertions are
 * deterministic and cleanup is scoped (no full-wipe).
 */
import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';
import { Roles, Permissions } from '@rrh-ems/shared';


const jwt = require('jsonwebtoken');
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

function signToken(payload: any): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '24h' });
}

// Authenticated MD in an isolated company -> has ADMIN_SYSTEM_METRICS (JWT-embedded).
function mdToken(companyId: number, employeeId: number): string {
  return signToken({
    employeeId,
    employeeCode: `RRH-EMP-${employeeId.toString().padStart(3, '0')}`,
    companyId,
    branchId: null,
    roles: [Roles.MD],
    permissions: [Permissions.ADMIN_SYSTEM_METRICS],
  });
}

// Telecaller token WITHOUT ADMIN_SYSTEM_METRICS -> used for the 403 test.
function telecallerToken(companyId: number, employeeId: number): string {
    return signToken({
      employeeId,
      employeeCode: `RRH-TC-${employeeId.toString().padStart(3, '0')}`,
      companyId,
      branchId: null,
      roles: ['TELECALLER'],
      permissions: ['LEADS_READ']
    });
}

// Unique test-run identifier (process PID ensures uniqueness across Jest runs)
const TEST_RUN_ID = process.pid.toString().padStart(5, '0');

async function createCompany(name: string, code: string) {
  // Use test-run-specific code to prevent cross-run data contamination
  const uniqueCode = `${code}_${TEST_RUN_ID}`;
  return await prisma.company.upsert({ where: { code: uniqueCode }, update: { name }, create: { name, code: uniqueCode } });
}

async function createEmployee(
  companyId: number,
  code: string,
  role: string,
  fullName: string,
  attendanceRequired = true
) {
  return await prisma.employee.upsert({
    where: { employee_code: code },
    update: {
      company_id: companyId,
      full_name: fullName,
      status: 'ACTIVE',
      attendance_required: attendanceRequired,
      password_hash: 'hash',
    },
    create: {
      employee_code: code,
      full_name: fullName,
      phone: `+917777${String(code.length).padStart(5, '0')}`,
      password_hash: 'hash',
      company_id: companyId,
      status: 'ACTIVE',
      attendance_required: attendanceRequired,
      roles: { create: { role: { connect: { name: role } } } },
    },
  });
}

// Scoped cleanup — deletes ONLY rows for the given company + employee ids.
async function wipeCompany(companyId: number, employeeIds: number[]) {
  // Delete FK-dependent domain rows BEFORE employees, because Property/Lead reference
  // employees via created_by_id and would otherwise block employee.deleteMany.
  await prisma.lead.deleteMany({ where: { company_id: companyId } });
  await prisma.booking.deleteMany({ where: { company_id: companyId } });
  await prisma.customer.deleteMany({ where: { company_id: companyId } });
  await prisma.property.deleteMany({ where: { company_id: companyId } });

  if (employeeIds.length) {
    await prisma.dailyReport.deleteMany({ where: { employee_id: { in: employeeIds } } });
    await prisma.attendanceLog.deleteMany({ where: { employee_id: { in: employeeIds } } });
    await prisma.task.deleteMany({ where: { assignee_id: { in: employeeIds } } });
    await prisma.auditEvent.deleteMany({ where: { actor_id: { in: employeeIds } } });
    await prisma.employeeRole.deleteMany({ where: { employee_id: { in: employeeIds } } });
    await prisma.employee.deleteMany({ where: { id: { in: employeeIds } } });
  }
  await prisma.company.delete({ where: { id: companyId } });
}

describe('Phase 16 Packet B — /api/v1/analytics/kpis', () => {
  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against the isolated test database.');
    }
    await setupDeterministicTestUsers();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('authentication & authorization', () => {
    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).get('/api/v1/analytics/kpis');
      expect(res.status).toBe(401);
    });

    it('requires ADMIN_SYSTEM_METRICS (403 for a telecaller)', async () => {
      const tcUser = await prisma.employee.findFirst();
      const token = telecallerToken(1, tcUser!.id);
      const res = await request(app).get('/api/v1/analytics/kpis').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('KPI correctness (isolated company)', () => {
    let companyId: number;
    let mdId: number;
    let token: string;

    beforeAll(async () => {
      const company = await createCompany('PKB KPI Company', 'PKB_KPI_COMP');
      companyId = company.id;
      const md = await createEmployee(companyId, 'PKB-KPI-MD', Roles.MD, 'PKB KPI MD');
      mdId = md.id;
      token = mdToken(companyId, mdId);

      // PROACTIVE CLEANUP: remove any leftover test data from previous runs
      // to prevent Unique constraint collisions (lead_code, customer_code)
      await prisma.lead.deleteMany({ where: { company_id: companyId } });
      await prisma.property.deleteMany({ where: { company_id: companyId } });
      await prisma.customer.deleteMany({ where: { company_id: companyId } });
      await prisma.booking.deleteMany({ where: { company_id: companyId } });

      // KPI 1-3: 10 leads -> 7 NEW, 2 SITE_VISIT_SCHEDULED, 1 BOOKED.
      for (let i = 0; i < 7; i++) {
        await prisma.lead.create({
          data: {
            lead_code: `LD-${companyId}-${i}`,
            company_id: companyId,
            customer_name: `Lead ${i}`,
            phone: `+9177000${i}`,
            status: 'NEW',
          },
        });
      }
      for (let i = 0; i < 2; i++) {
        await prisma.lead.create({
          data: {
            lead_code: `LD-SV-${companyId}-${i}`,
            company_id: companyId,
            customer_name: `SiteVisit ${i}`,
            phone: `+9177111${i}`,
            status: 'SITE_VISIT_SCHEDULED',
          },
        });
      }
      await prisma.lead.create({
        data: {
          lead_code: `LD-WON-${companyId}`,
          company_id: companyId,
          customer_name: 'Won Deal',
          phone: '+91772220',
          status: 'BOOKED',
        },
      });

      // KPI 4: 4 properties -> 1 LIVE, 1 PENDING_MD_APPROVAL, 1 PENDING_VERIFICATION, 1 REJECTED.
      const statuses = ['LIVE', 'PENDING_MD_APPROVAL', 'PENDING_VERIFICATION', 'REJECTED'];
      for (let i = 0; i < statuses.length; i++) {
        await prisma.property.create({
          data: {
            property_code: `PRP-${companyId}-${i}`,
            company_id: companyId,
            title: `Property ${i}`,
            price: 1000000,
            area_sqft: 1000,
            location: 'Test Location',
            created_by_id: mdId,
            status: statuses[i],
          },
        });
      }
    });

    afterAll(async () => {
      await wipeCompany(companyId, [mdId]);

      // FK-safe cleanup: remove dependents before employee deletion
      await prisma.dailyReport.deleteMany({ where: { employee_id: { in: [mdId] } } });
      await prisma.task.deleteMany({ where: { assignee_id: { in: [mdId] } } });
      await prisma.attendanceLog.deleteMany({ where: { employee_id: { in: [mdId] } } });
      await prisma.auditEvent.deleteMany({ where: { actor_id: { in: [mdId] } } });
      await prisma.employeeRole.deleteMany({ where: { employee_id: { in: [mdId] } } });
      await prisma.employee.deleteMany({ where: { id: { in: [mdId] } } });
      await prisma.lead.deleteMany({ where: { company_id: companyId } });
      await prisma.property.deleteMany({ where: { company_id: companyId } });
      await prisma.customer.deleteMany({ where: { company_id: companyId } });
      await prisma.booking.deleteMany({ where: { company_id: companyId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
      expect(await prisma.lead.count({ where: { company_id: companyId } })).toBe(0);
      expect(await prisma.property.count({ where: { company_id: companyId } })).toBe(0);
      expect(await prisma.customer.count({ where: { company_id: companyId } })).toBe(0);
      expect(await prisma.booking.count({ where: { company_id: companyId } })).toBe(0);
      expect(await prisma.company.findUnique({ where: { id: companyId } })).toBeNull();
    });

    // KPI 5 (bookings) + KPI 9 (daily reports) + KPI 7/8 (attendance/tasks) seeding.
    beforeAll(async () => {
      const [propByCode] = await Promise.all([
        prisma.property.findFirst({ where: { company_id: companyId, status: 'LIVE' } }),
      ]);
      const property1 = propByCode!;
      const customer = await prisma.customer.create({
        data: {
          customer_code: `CUST-${companyId}-1`,
          company_id: companyId,
          first_name: 'PKB',
          last_name: 'Customer',
          phone: '+917733300',
        },
      });
      for (let i = 0; i < 5; i++) {
        await prisma.booking.create({
          data: {
            booking_code: `BK-${companyId}-${i}`,
            company_id: companyId,
            customer_id: customer.id,
            property_id: property1.id,
            agreed_price: 1000000,
            booking_amount: 100000,
            balance_amount: 900000,
          },
        });
      }

      // KPI 7 + KPI 8: MD attendance (1 PRESENT + 1 LATE today), 2 completed tasks,
      // 1 daily report (target_met = true). Score = 50 + 2 + 0.5 + 0.5 - 1.0 = 52.0.
      await prisma.attendanceLog.create({ data: { employee_id: mdId, status: 'PRESENT' } });
      await prisma.attendanceLog.create({ data: { employee_id: mdId, status: 'LATE' } });
      for (let i = 0; i < 2; i++) {
        await prisma.task.create({
          data: {
            title: `PKB-Completed-${i}`,
            assignee: { connect: { id: mdId } },
            target_date: new Date(),
            created_by: mdId,
            status: 'COMPLETED',
            completed_at: new Date(),
          },
        });
      }
      await prisma.dailyReport.create({
        data: {
          employee_id: mdId,
          submitted_at: new Date(),
          summary: 'PKB daily report',
          target_met: true,
        },
      });
    });

    it('returns 200 and hand-computed KPI values', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/kpis')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const body: any = res.body;

      expect(body.companyId).toBe(companyId);
      expect(body.generatedAt).toBeDefined();

      // CRM (KPIs 1-3)
      expect(body.crm.totalLeads).toBe(10);
      expect(body.crm.wonLeads).toBe(1);
      expect(body.crm.siteVisitsScheduled).toBe(2);

      // Property (KPI 4) - REJECTED counted in total, excluded from buckets.
      expect(body.property).toEqual({ total: 4, live: 1, pendingMD: 1, pendingPM: 1 });

      // Booking (KPI 5)
      expect(body.booking.totalBookings).toBe(5);

      // HR (KPIs 6, 7) - MD stamped today (PRESENT) -> 0 exceptions.
      expect(body.hr.activeEmployees).toBe(1);
      expect(body.hr.attendanceExceptionsToday).toBe(0);

      // Performance (KPI 8) - 52.0 via the centralized Packet A formula.
      expect(body.performance.teamPerformance.totalEmployees).toBe(1);
      expect(body.performance.teamPerformance.averageScore).toBe(52.0);
      expect(body.performance.teamPerformance.minScore).toBe(52.0);
      expect(body.performance.teamPerformance.maxScore).toBe(52.0);

      // Targets (KPI 9) - 1 report today, target_met = true.
      expect(body.targets.targetAttainment).toEqual({ met: 1, total: 1, rate: 100 });

      // Marketing (KPI 10) - reused IntegrationService, company-scoped.
      expect(body.marketing).toBeDefined();
      expect(body.marketing.company_id).toBe(companyId);
      expect(body.marketing.outbox.total).toBe(0);

      // Opportunity - reused service, present + company-scoped.
      expect(body.opportunity).toBeDefined();
      expect(typeof body.opportunity.pipelineMetrics).toBe('object');
      expect(typeof body.opportunity.conversionMetrics).toBe('object');
    });
  });

  describe('company isolation', () => {
    let companyAId: number;
    let companyBId: number;
    let mdAId: number;
    let tokenA: string;

    beforeAll(async () => {
      const companyA = await createCompany('PKB Comp A', 'PKB_ISO_A');
      const companyB = await createCompany('PKB Comp B', 'PKB_ISO_B');
      companyAId = companyA.id;
      companyBId = companyB.id;
      const mdA = await createEmployee(companyAId, 'PKB-ISOA-MD', Roles.MD, 'PKB ISO A MD');
      mdAId = mdA.id;
      tokenA = mdToken(companyAId, mdAId);

      // PROACTIVE CLEANUP: remove any leftover test data from previous runs
      // to prevent Unique constraint collisions (lead_code, customer_code)
      await prisma.lead.deleteMany({ where: { company_id: companyAId } });
      await prisma.property.deleteMany({ where: { company_id: companyAId } });
      await prisma.customer.deleteMany({ where: { company_id: companyAId } });
      await prisma.booking.deleteMany({ where: { company_id: companyAId } });

      // Company B: also cleanup
      await prisma.lead.deleteMany({ where: { company_id: companyBId } });
      await prisma.property.deleteMany({ where: { company_id: companyBId } });
      await prisma.customer.deleteMany({ where: { company_id: companyBId } });
      await prisma.booking.deleteMany({ where: { company_id: companyBId } });

      // Company A: 10 leads (2 BOOKED, 3 SITE_VISIT_SCHEDULED, 5 NEW)
      const aSpec = [{ n: 2, status: 'BOOKED' }, { n: 3, status: 'SITE_VISIT_SCHEDULED' }, { n: 5, status: 'NEW' }];
      let seq = 0;
      for (const { n, status } of aSpec) {
        for (let i = 0; i < n; i++) {
          await prisma.lead.create({
            data: {
              lead_code: `ISOA-LD-${seq}`,
              company_id: companyAId,
              customer_name: `A Lead ${seq}`,
              phone: `+918000${seq}`,
              status,
            },
          });
          seq++;
        }
      }

      // Company B: 100 leads (50 BOOKED, 20 SITE_VISIT_SCHEDULED, 30 NEW) — materially different.
      const bSpec = [{ n: 50, status: 'BOOKED' }, { n: 20, status: 'SITE_VISIT_SCHEDULED' }, { n: 30, status: 'NEW' }];
      let bseq = 0;
      for (const { n, status } of bSpec) {
        for (let i = 0; i < n; i++) {
          await prisma.lead.create({
            data: {
              lead_code: `ISOB-LD-${bseq}`,
              company_id: companyBId,
              customer_name: `B Lead ${bseq}`,
              phone: `+919000${bseq}`,
              status,
            },
          });
          bseq++;
        }
      }
    });

    afterAll(async () => {
      // FK-safe cleanup: remove dependents before employee deletion
      await prisma.dailyReport.deleteMany({ where: { employee_id: { in: [mdAId] } } });
      await prisma.task.deleteMany({ where: { assignee_id: { in: [mdAId] } } });
      await prisma.attendanceLog.deleteMany({ where: { employee_id: { in: [mdAId] } } });
      await prisma.auditEvent.deleteMany({ where: { actor_id: { in: [mdAId] } } });
      await prisma.employeeRole.deleteMany({ where: { employee_id: { in: [mdAId] } } });
      await prisma.employee.deleteMany({ where: { id: { in: [mdAId] } } });
      await prisma.lead.deleteMany({ where: { company_id: companyAId } });
      await prisma.property.deleteMany({ where: { company_id: companyAId } });
      await prisma.customer.deleteMany({ where: { company_id: companyAId } });
      await prisma.booking.deleteMany({ where: { company_id: companyAId } });
      await prisma.company.delete({ where: { id: companyAId } });
      await prisma.dailyReport.deleteMany({ where: { employee_id: { in: [mdAId] } } });
      await prisma.task.deleteMany({ where: { assignee_id: { in: [mdAId] } } });
      await prisma.attendanceLog.deleteMany({ where: { employee_id: { in: [mdAId] } } });
      await prisma.auditEvent.deleteMany({ where: { actor_id: { in: [mdAId] } } });
      await prisma.employeeRole.deleteMany({ where: { employee_id: { in: [mdAId] } } });
      await prisma.employee.deleteMany({ where: { id: { in: [mdAId] } } });
      await prisma.lead.deleteMany({ where: { company_id: companyBId } });
      await prisma.property.deleteMany({ where: { company_id: companyBId } });
      await prisma.customer.deleteMany({ where: { company_id: companyBId } });
      await prisma.booking.deleteMany({ where: { company_id: companyBId } });
      await prisma.company.delete({ where: { id: companyBId } });
      expect(await prisma.lead.count({ where: { company_id: companyBId } })).toBe(0);
      expect(await prisma.company.findUnique({ where: { id: companyBId } })).toBeNull();
    });

    it('only aggregates the authenticated company (B data excluded)', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/kpis')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      const body: any = res.body;

      // Company B has 50 BOOKED + 20 SITE_VISIT_SCHEDULED = 110 total. If the
      // company filter were missing, these would bleed into A (110 / 52 / 23).
      expect(body.companyId).toBe(companyAId);
      expect(body.crm.totalLeads).toBe(10);
      expect(body.crm.wonLeads).toBe(2);
      expect(body.crm.siteVisitsScheduled).toBe(3);
    });
  });

  describe('empty dataset', () => {
    let companyId: number;
    let mdId: number;
    let token: string;

    beforeAll(async () => {
      const company = await createCompany('PKB Empty Company', 'PKB_EMPTY_COMP');
      companyId = company.id;
      // attendance_required = false (exempt) so attendance exceptions == 0.
      const md = await createEmployee(companyId, 'PKB-EMPTY-MD', Roles.MD, 'PKB Empty MD', false);
      mdId = md.id;
      token = mdToken(companyId, mdId);

      // PROACTIVE CLEANUP: remove any leftover test data from previous runs
      // to prevent Unique constraint collisions (lead_code, customer_code)
      await prisma.lead.deleteMany({ where: { company_id: companyId } });
      await prisma.property.deleteMany({ where: { company_id: companyId } });
      await prisma.customer.deleteMany({ where: { company_id: companyId } });
      await prisma.booking.deleteMany({ where: { company_id: companyId } });
    });

    afterAll(async () => {
      // FK-safe cleanup: remove dependents before employee deletion
      await prisma.dailyReport.deleteMany({ where: { employee_id: { in: [mdId] } } });
      await prisma.task.deleteMany({ where: { assignee_id: { in: [mdId] } } });
      await prisma.attendanceLog.deleteMany({ where: { employee_id: { in: [mdId] } } });
      await prisma.auditEvent.deleteMany({ where: { actor_id: { in: [mdId] } } });
      await prisma.employeeRole.deleteMany({ where: { employee_id: { in: [mdId] } } });
      await prisma.employee.deleteMany({ where: { id: { in: [mdId] } } });
      await prisma.lead.deleteMany({ where: { company_id: companyId } });
      await prisma.property.deleteMany({ where: { company_id: companyId } });
      await prisma.customer.deleteMany({ where: { company_id: companyId } });
      await prisma.booking.deleteMany({ where: { company_id: companyId } });
      await prisma.company.delete({ where: { id: companyId } });
      expect(await prisma.lead.count({ where: { company_id: companyId } })).toBe(0);
      expect(await prisma.company.findUnique({ where: { id: companyId } })).toBeNull();
    });

    it('returns safe zero/empty values with no errors', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/kpis')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const body: any = res.body;

      expect(body.companyId).toBe(companyId);
      expect(body.crm).toEqual({ totalLeads: 0, wonLeads: 0, siteVisitsScheduled: 0 });
      expect(body.property).toEqual({ total: 0, live: 0, pendingMD: 0, pendingPM: 0 });
      expect(body.booking).toEqual({ totalBookings: 0 });
      expect(body.hr).toEqual({ activeEmployees: 1, attendanceExceptionsToday: 0 });

      expect(body.performance.teamPerformance.totalEmployees).toBe(1);
      expect(body.performance.teamPerformance.averageScore).toBe(50.0);
      expect(body.performance.teamPerformance.minScore).toBe(50.0);
      expect(body.performance.teamPerformance.maxScore).toBe(50.0);

      expect(body.targets.targetAttainment).toEqual({ met: 0, total: 0, rate: 0 });

      expect(body.marketing).toBeDefined();
      expect(body.marketing.company_id).toBe(companyId);
      expect(body.marketing.outbox.total).toBe(0);
      expect(body.marketing.payments.total).toBe(0);

      expect(body.opportunity).toBeDefined();
      expect(typeof body.opportunity.pipelineMetrics).toBe('object');
      expect(typeof body.opportunity.conversionMetrics).toBe('object');
    });
  });
});



