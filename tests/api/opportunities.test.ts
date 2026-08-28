import request from 'supertest';
import express from 'express';
import { prisma } from '../../apps/api/src/lib/prisma';
import { Permissions, Roles } from '@rrh-ems/shared';
import { generateAccessToken } from '../../apps/api/src/utils/jwt';
import opportunityRoutes from '../../apps/api/src/routes/opportunities';

const app = express();
app.use(express.json());
app.use('/api/v1/opportunities', opportunityRoutes);


const p = prisma as any;

describe('Phase 8 Packet 2 - Opportunity Service & Security', () => {
  let companyAId: number;
  let companyBId: number;
  let empAId: number;
  let empBId: number;
  let leadAId: number;
  let leadBId: number;
  let projectAId: number;
  let projectBId: number;
  let propertyAId: number;
  let propertyBId: number;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    // Setup test data
    const ts = Date.now();
    const compA = await p.company.create({ data: { name: `Comp A ${ts}`, code: `C-A-${ts}` } });
    companyAId = compA.id;
    const compB = await p.company.create({ data: { name: `Comp B ${ts}`, code: `C-B-${ts}` } });
    companyBId = compB.id;

    const empA = await p.employee.create({ data: { company_id: companyAId, employee_code: `EA1-${ts}`, full_name: 'EA1', password_hash: '123' } });
    empAId = empA.id;
    const empB = await p.employee.create({ data: { company_id: companyBId, employee_code: `EB1-${ts}`, full_name: 'EB1', password_hash: '123' } });
    empBId = empB.id;

    const leadA = await p.lead.create({ data: { company_id: companyAId, lead_code: `LD-A-${ts}`, customer_name: 'Customer A', phone: '111', created_by_id: empAId, assigned_to_id: empAId, status: 'NEW' } });
    leadAId = leadA.id;
    const leadB = await p.lead.create({ data: { company_id: companyBId, lead_code: `LD-B-${ts}`, customer_name: 'Customer B', phone: '222', created_by_id: empBId, assigned_to_id: empBId, status: 'NEW' } });
    leadBId = leadB.id;

    const projA = await p.project.create({ data: { company_id: companyAId, project_code: `PRJ-A-${ts}`, name: 'Proj A', location: 'Loc A', status: 'PLANNING' } });
    projectAId = projA.id;
    const projB = await p.project.create({ data: { company_id: companyBId, project_code: `PRJ-B-${ts}`, name: 'Proj B', location: 'Loc B', status: 'PLANNING' } });
    projectBId = projB.id;

    const propA = await p.property.create({ data: { company_id: companyAId, property_code: `PRP-A-${ts}`, project_id: projectAId, title: 'Prop A', status: 'LIVE', category: 'APARTMENT', location: 'Loc A', created_by_id: empAId, price: 1000000, area_sqft: 1000 } });
    propertyAId = propA.id;
    const propB = await p.property.create({ data: { company_id: companyBId, property_code: `PRP-B-${ts}`, project_id: projectBId, title: 'Prop B', status: 'LIVE', category: 'APARTMENT', location: 'Loc B', created_by_id: empBId, price: 2000000, area_sqft: 2000 } });
    propertyBId = propB.id;

    tokenA = generateAccessToken({ employeeId: empAId, companyId: companyAId, roles: [Roles.AGENT], permissions: [Permissions.LEADS_UPDATE, Permissions.LEADS_READ] });
    tokenB = generateAccessToken({ employeeId: empBId, companyId: companyBId, roles: [Roles.AGENT], permissions: [Permissions.LEADS_UPDATE, Permissions.LEADS_READ] });
  });

  it('Create Opportunity from valid Lead and check Lead status', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadAId, expected_value: 10000 });

    expect(res.status).toBe(201);
    expect(res.body.opportunity).toBeDefined();
    expect(res.body.opportunity.stage).toBe('PROSPECT_QUALIFIED');
    expect(res.body.opportunity.expected_value).toBe(10000);

    // Verify Lead Status transitioned
    const updatedLead = await p.lead.findUnique({ where: { id: leadAId } });
    expect(updatedLead.status).toBe('OPPORTUNITY_OPEN');

    // Verify OpportunityHistory is created
    const history = await p.opportunityHistory.findFirst({ where: { opportunity_id: res.body.opportunity.id } });
    expect(history).toBeDefined();
    expect(history.to_stage).toBe('PROSPECT_QUALIFIED');
  });

  it('Cross-company Lead rejection', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadBId }); // Company A trying to use Company B lead

    expect(res.status).toBe(404);
  });

  it('Cross-company Project rejection', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadAId, project_id: projectBId });

    expect(res.status).toBe(404);
  });

  it('Cross-company Property rejection', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadAId, property_id: propertyBId });

    expect(res.status).toBe(404);
  });

  it('Cross-company Owner rejection', async () => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadAId, owner_id: empBId });

    expect(res.status).toBe(400);
  });

  it('Valid stage transition and DROPPED requirement', async () => {
    const oppRes = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadAId });
    
    const oppId = oppRes.body.opportunity.id;

    // Transition to REQUIREMENT_CAPTURED
    const step1 = await request(app)
      .patch(`/api/v1/opportunities/${oppId}/stage`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ stage: 'REQUIREMENT_CAPTURED' });
    expect(step1.status).toBe(200);

    // Invalid transition
    const step2 = await request(app)
      .patch(`/api/v1/opportunities/${oppId}/stage`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ stage: 'BOOKED' }); // Invalid jump
    expect(step2.status).toBe(409); // Conflict

    // Terminal DROPPED without reason
    const step3 = await request(app)
      .patch(`/api/v1/opportunities/${oppId}/stage`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ stage: 'DROPPED' });
    expect(step3.status).toBe(409); // Needs reason

    // Terminal DROPPED with reason
    const step4 = await request(app)
      .patch(`/api/v1/opportunities/${oppId}/stage`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ stage: 'DROPPED', drop_reason: 'Too expensive' });
    expect(step4.status).toBe(200);
  });

  it('Cross-company Opportunity GET rejection', async () => {
    const oppRes = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadAId });
    
    const oppId = oppRes.body.opportunity.id;

    // Company B trying to read Company A opportunity
    const res = await request(app)
      .get(`/api/v1/opportunities/${oppId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    
    expect(res.status).toBe(404);
  });
});
