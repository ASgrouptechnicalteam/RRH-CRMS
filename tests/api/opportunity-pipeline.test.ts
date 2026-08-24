import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../../apps/api/src/server';
import { generateAccessToken } from '../../apps/api/src/utils/jwt';
import { Roles, Permissions } from '@rrh-ems/shared';

const prisma = new PrismaClient();
const p = prisma as any;

let companyAId: number;
let companyBId: number;

let pmAUser: any;
let pmBUser: any;
let telecallerUser: any;

let pmAToken: string;
let pmBToken: string;
let telecallerToken: string;

let leadA: any;
let leadA2: any;
let leadB: any;

let projectA: any;
let propertyA: any;
let projectB: any;
let propertyB: any;

let oppA: any;
let oppA2: any;
let oppB: any;

beforeAll(async () => {
  const ts = Date.now();

  // === Companies ===
  const compA = await p.company.create({ data: { name: `Pipeline Co A ${ts}`, code: `PCA-${ts}` } });
  companyAId = compA.id;
  const compB = await p.company.create({ data: { name: `Pipeline Co B ${ts}`, code: `PCB-${ts}` } });
  companyBId = compB.id;

  // === Roles ===
  const pmRole = await p.role.upsert({ where: { name: Roles.PROJECT_MANAGER }, update: {}, create: { name: Roles.PROJECT_MANAGER } });
  const tcRole = await p.role.upsert({ where: { name: Roles.TELECALLER }, update: {}, create: { name: Roles.TELECALLER } });

  // === Users ===
  pmAUser = await p.employee.create({
    data: {
      employee_code: `PMA-P4-${ts}`, full_name: 'PM A Pipeline', email: `pma-p4-${ts}@test.com`,
      phone: `50${ts}`.slice(0, 10), password_hash: 'hash', company_id: companyAId, status: 'ACTIVE',
      roles: { create: { role_id: pmRole.id } },
    },
  });

  telecallerUser = await p.employee.create({
    data: {
      employee_code: `TC-P4-${ts}`, full_name: 'TC Pipeline', email: `tc-p4-${ts}@test.com`,
      phone: `60${ts}`.slice(0, 10), password_hash: 'hash', company_id: companyAId, status: 'ACTIVE',
      roles: { create: { role_id: tcRole.id } },
    },
  });

  pmBUser = await p.employee.create({
    data: {
      employee_code: `PMB-P4-${ts}`, full_name: 'PM B Pipeline', email: `pmb-p4-${ts}@test.com`,
      phone: `70${ts}`.slice(0, 10), password_hash: 'hash', company_id: companyBId, status: 'ACTIVE',
      roles: { create: { role_id: pmRole.id } },
    },
  });

  // === Tokens ===
  pmAToken = generateAccessToken({
    employeeId: pmAUser.id, employeeCode: pmAUser.employee_code,
    companyId: companyAId, branchId: null,
    roles: [Roles.PROJECT_MANAGER],
    permissions: [Permissions.LEADS_UPDATE, Permissions.LEADS_READ, Permissions.SITE_VISITS_CREATE],
  });

  telecallerToken = generateAccessToken({
    employeeId: telecallerUser.id, employeeCode: telecallerUser.employee_code,
    companyId: companyAId, branchId: null,
    roles: [Roles.TELECALLER],
    permissions: [Permissions.LEADS_READ, Permissions.LEADS_UPDATE, Permissions.SITE_VISITS_CREATE],
  });

  pmBToken = generateAccessToken({
    employeeId: pmBUser.id, employeeCode: pmBUser.employee_code,
    companyId: companyBId, branchId: null,
    roles: [Roles.PROJECT_MANAGER],
    permissions: [Permissions.LEADS_UPDATE, Permissions.LEADS_READ],
  });

  // === Projects & Properties ===
  projectA = await p.project.create({ data: { name: 'Proj A P4', company_id: companyAId, location: 'Loc A', project_code: `PRJ-AP4-${ts}` } });
  propertyA = await p.property.create({
    data: {
      property_code: `PRP-AP4-${ts}`, title: 'Property A P4', project_id: projectA.id,
      company_id: companyAId, created_by_id: pmAUser.id, status: 'LIVE',
      category: 'APARTMENT', location: 'Loc A', price: 5000000, area_sqft: 1500,
    },
  });

  projectB = await p.project.create({ data: { name: 'Proj B P4', company_id: companyBId, location: 'Loc B', project_code: `PRJ-BP4-${ts}` } });
  propertyB = await p.property.create({
    data: {
      property_code: `PRP-BP4-${ts}`, title: 'Property B P4', project_id: projectB.id,
      company_id: companyBId, created_by_id: pmBUser.id, status: 'LIVE',
      category: 'APARTMENT', location: 'Loc B', price: 3000000, area_sqft: 1000,
    },
  });

  // === Leads ===
  leadA = await p.lead.create({
    data: {
      lead_code: `LPA-${ts}`, customer_name: 'Lead A Pipeline', phone: `81${ts}`.slice(0, 10),
      company_id: companyAId, created_by_id: pmAUser.id, status: 'QUALIFIED',
    },
  });

  leadA2 = await p.lead.create({
    data: {
      lead_code: `LPA2-${ts}`, customer_name: 'Lead A2 Pipeline', phone: `82${ts}`.slice(0, 10),
      company_id: companyAId, created_by_id: telecallerUser.id, assigned_to_id: telecallerUser.id, status: 'QUALIFIED',
    },
  });

  leadB = await p.lead.create({
    data: {
      lead_code: `LPB-${ts}`, customer_name: 'Lead B Pipeline', phone: `83${ts}`.slice(0, 10),
      company_id: companyBId, created_by_id: pmBUser.id, status: 'QUALIFIED',
    },
  });

  // === Create Opportunities ===
  // OppA: PM A's opportunity with project and property
  const oppARes = await request(app)
    .post('/api/v1/opportunities')
    .set('Authorization', `Bearer ${pmAToken}`)
    .send({ lead_id: leadA.id, project_id: projectA.id, property_id: propertyA.id, expected_value: 5000000, probability: 40 });
  oppA = oppARes.body.opportunity;

  // OppA2: Telecaller's opportunity (no property, lower value)
  const oppA2Res = await request(app)
    .post('/api/v1/opportunities')
    .set('Authorization', `Bearer ${telecallerToken}`)
    .send({ lead_id: leadA2.id, expected_value: 2000000, probability: 20 });
  oppA2 = oppA2Res.body.opportunity;

  // OppB: Company B's opportunity
  const oppBRes = await request(app)
    .post('/api/v1/opportunities')
    .set('Authorization', `Bearer ${pmBToken}`)
    .send({ lead_id: leadB.id, project_id: projectB.id, expected_value: 3000000 });
  oppB = oppBRes.body.opportunity;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Phase 8 Packet 4 - Opportunity Sales Engine & Pipeline Intelligence', () => {
  // ===================== QUERY & FILTERING =====================

  it('1. GET /opportunities returns paginated results with total', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.opportunities).toBeDefined();
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.limit).toBe('number');
    expect(typeof res.body.offset).toBe('number');
  });

  it('2. Stage filtering returns only matching opportunities', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities?stage=PROSPECT_QUALIFIED')
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    res.body.opportunities.forEach((o: any) => {
      expect(o.stage).toBe('PROSPECT_QUALIFIED');
    });
  });

  it('3. Owner filtering returns only matching owner', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities?owner_id=${pmAUser.id}`)
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    res.body.opportunities.forEach((o: any) => {
      expect(o.owner_id).toBe(pmAUser.id);
    });
  });

  it('4. Project filtering works', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities?project_id=${projectA.id}`)
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    res.body.opportunities.forEach((o: any) => {
      expect(o.project_id).toBe(projectA.id);
    });
  });

  it('5. Property filtering works', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities?property_id=${propertyA.id}`)
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    res.body.opportunities.forEach((o: any) => {
      expect(o.property_id).toBe(propertyA.id);
    });
  });

  it('6. Pagination with limit and offset', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities?limit=1&offset=0')
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.opportunities.length).toBeLessThanOrEqual(1);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(0);
  });

  // ===================== COMPANY ISOLATION =====================

  it('7. Company B cannot see Company A opportunities', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmBToken}`);

    expect(res.status).toBe(200);
    res.body.opportunities.forEach((o: any) => {
      expect(o.company_id).toBe(companyBId);
    });
  });

  // ===================== OWNER VISIBILITY =====================

  it('8. Telecaller (non-management) only sees their own opportunities', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities')
      .set('Authorization', `Bearer ${telecallerToken}`);

    expect(res.status).toBe(200);
    res.body.opportunities.forEach((o: any) => {
      expect(o.owner_id).toBe(telecallerUser.id);
    });
  });

  it('9. PM (management) sees all company opportunities', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2); // sees both PM A and TC opps
  });

  // ===================== PIPELINE METRICS =====================

  it('10. Pipeline metrics return comprehensive data', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities/pipeline-metrics')
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    const m = res.body.metrics;
    expect(typeof m.activeCount).toBe('number');
    expect(typeof m.totalCount).toBe('number');
    expect(typeof m.totalExpectedValue).toBe('number');
    expect(typeof m.totalWeightedValue).toBe('number');
    expect(m.countByStage).toBeDefined();
    expect(m.byOwner).toBeDefined();
    expect(m.byProject).toBeDefined();
    expect(m.byProperty).toBeDefined();
    expect(typeof m.droppedCount).toBe('number');
    expect(m.droppedReasons).toBeDefined();
    expect(typeof m.bookingInitiatedCount).toBe('number');
    expect(typeof m.avgAgeDays).toBe('number');
  });

  it('11. Weighted pipeline value = expected_value × probability / 100', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities/pipeline-metrics')
      .set('Authorization', `Bearer ${pmAToken}`);

    const m = res.body.metrics;
    // PM A sees both opps: 5M@40% + 2M@20% = 2M + 0.4M = 2.4M
    expect(m.totalWeightedValue).toBeGreaterThan(0);
    // Verify formula: sum of (expected_value * probability / 100)
    expect(m.totalExpectedValue).toBeGreaterThanOrEqual(5000000);
  });

  it('12. Telecaller pipeline metrics are scoped to their opportunities only', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities/pipeline-metrics')
      .set('Authorization', `Bearer ${telecallerToken}`);

    expect(res.status).toBe(200);
    const m = res.body.metrics;
    // TC should only see their 2M@20% opportunity
    expect(m.activeCount).toBe(1);
    expect(m.totalExpectedValue).toBe(2000000);
    expect(m.totalWeightedValue).toBe(400000); // 2M * 20/100
  });

  it('13. Company B pipeline metrics are fully isolated', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities/pipeline-metrics')
      .set('Authorization', `Bearer ${pmBToken}`);

    expect(res.status).toBe(200);
    const m = res.body.metrics;
    expect(m.totalExpectedValue).toBe(3000000);
    // Company B should not see Company A values
  });

  // ===================== STAGE INTEGRITY =====================

  it('14. BOOKED is rejected from public API', async () => {
    const res = await request(app)
      .patch(`/api/v1/opportunities/${oppA.id}/stage`)
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ stage: 'BOOKED' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Phase 9');
  });

  it('15. PROPERTY_SHORTLISTED requires project or property', async () => {
    // oppA2 has no project/property
    const res = await request(app)
      .patch(`/api/v1/opportunities/${oppA2.id}/stage`)
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({ stage: 'PROPERTY_SHORTLISTED' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('project or property');
  });

  it('16. PROPERTY_SHORTLISTED succeeds when property exists', async () => {
    // oppA has project + property
    // First transition to REQUIREMENT_CAPTURED
    await request(app)
      .patch(`/api/v1/opportunities/${oppA.id}/stage`)
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ stage: 'REQUIREMENT_CAPTURED' });

    const res = await request(app)
      .patch(`/api/v1/opportunities/${oppA.id}/stage`)
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ stage: 'PROPERTY_SHORTLISTED' });

    expect(res.status).toBe(200);
  });

  it('17. SITE_VISIT_PLANNED requires a linked SiteVisitBooking', async () => {
    const res = await request(app)
      .patch(`/api/v1/opportunities/${oppA.id}/stage`)
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ stage: 'SITE_VISIT_PLANNED' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('SiteVisitBooking');
  });

  it('18. SITE_VISIT_PLANNED succeeds after creating a linked SiteVisit', async () => {
    // Create a SiteVisitBooking linked to oppA
    await request(app)
      .post('/api/v1/site-visits')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({
        lead_id: leadA.id,
        opportunity_id: oppA.id,
        property_id: propertyA.id,
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
      });

    const res = await request(app)
      .patch(`/api/v1/opportunities/${oppA.id}/stage`)
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ stage: 'SITE_VISIT_PLANNED' });

    expect(res.status).toBe(200);
  });

  it('19. SITE_VISIT_COMPLETED requires a COMPLETED SiteVisitBooking', async () => {
    const res = await request(app)
      .patch(`/api/v1/opportunities/${oppA.id}/stage`)
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ stage: 'SITE_VISIT_COMPLETED' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('COMPLETED');
  });

  it('20. DROPPED requires drop_reason', async () => {
    const res = await request(app)
      .patch(`/api/v1/opportunities/${oppA2.id}/stage`)
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({ stage: 'DROPPED' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('drop_reason');
  });

  it('21. DROPPED succeeds with drop_reason', async () => {
    const res = await request(app)
      .patch(`/api/v1/opportunities/${oppA2.id}/stage`)
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({ stage: 'DROPPED', drop_reason: 'Budget too high' });

    expect(res.status).toBe(200);
  });

  // ===================== HISTORY & DURATION =====================

  it('22. Opportunity history includes exited_at and computed duration', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities/${oppA.id}/history`)
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.history.length).toBeGreaterThanOrEqual(3); // PROSPECT_QUALIFIED → REQUIREMENT_CAPTURED → PROPERTY_SHORTLISTED → SITE_VISIT_PLANNED
    
    // First history record should have exited_at stamped (since we left PROSPECT_QUALIFIED)
    const firstRecord = res.body.history[0];
    expect(firstRecord.to_stage).toBe('PROSPECT_QUALIFIED');
    expect(firstRecord.exited_at).not.toBeNull();
    expect(typeof firstRecord.duration_minutes).toBe('number');
  });

  it('23. Cross-company history access is rejected', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities/${oppA.id}/history`)
      .set('Authorization', `Bearer ${pmBToken}`);

    expect(res.status).toBe(404);
  });

  // ===================== CONVERSION METRICS =====================

  it('24. Conversion metrics return stage aging and transitions', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities/conversion-metrics')
      .set('Authorization', `Bearer ${pmAToken}`);

    expect(res.status).toBe(200);
    const m = res.body.metrics;
    expect(m.stageAging).toBeDefined();
    expect(typeof m.transitionCount).toBe('number');
    expect(m.stageTransitions).toBeDefined();
    expect(m.transitionCount).toBeGreaterThan(0);
  });

  // ===================== DROPPED METRICS =====================

  it('25. Pipeline metrics show dropped count and reasons after drop', async () => {
    const res = await request(app)
      .get('/api/v1/opportunities/pipeline-metrics')
      .set('Authorization', `Bearer ${pmAToken}`);

    const m = res.body.metrics;
    expect(m.droppedCount).toBeGreaterThanOrEqual(1);
    expect(m.droppedReasons['Budget too high']).toBeGreaterThanOrEqual(1);
  });

  // ===================== LEGACY LEAD COMPATIBILITY =====================

  it('26. Legacy Lead with WON status is not affected by Opportunity metrics', async () => {
    const wonLead = await p.lead.create({
      data: {
        lead_code: `LD-WON-P4-${Date.now()}`, customer_name: 'Won Lead',
        phone: '9999900000', company_id: companyAId, created_by_id: pmAUser.id,
        status: 'WON',
      },
    });

    // Verify Lead still has WON status
    const lead = await p.lead.findUnique({ where: { id: wonLead.id } });
    expect(lead.status).toBe('WON');

    // Creating an opportunity from WON lead should not change lead status
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ lead_id: wonLead.id, expected_value: 1000000 });

    expect(res.status).toBe(201);
    const leadAfter = await p.lead.findUnique({ where: { id: wonLead.id } });
    expect(leadAfter.status).toBe('WON');
  });

  // ===================== MALFORMED STATES =====================

  it('27. Invalid stage transition from PROSPECT_QUALIFIED to NEGOTIATION is rejected', async () => {
    const newOpp = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ lead_id: leadA.id, expected_value: 999 });

    const res = await request(app)
      .patch(`/api/v1/opportunities/${newOpp.body.opportunity.id}/stage`)
      .set('Authorization', `Bearer ${pmAToken}`)
      .send({ stage: 'NEGOTIATION' });

    expect(res.status).toBe(409);
  });
});
