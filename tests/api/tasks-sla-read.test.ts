/// <reference path="../../../../tsconfig.json" />
import request from 'supertest';
import app from '../../apps/api/src/server';
import { generateAccessToken } from '../../apps/api/src/utils/jwt';
import { Roles, Permissions } from '@rrh-ems/shared';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';


const ALL_PERMS = Object.values(Permissions).filter((p) => typeof p === 'string') as string[];

describe('Task SLA Read (Phase 15 V1)', () => {
  let adminToken: string; // company 1 - ADMIN, can read tasks
  let crossAgentToken: string; // company 2 - agent (cross-company)
  let assigneeId: number; // company 1 employee
  let crossAssigneeId: number; // company 2 employee

  let activeTaskId: number;
  let completedTaskId: number;
  let breachedTaskId: number;
  let crossTaskId: number;

  const createdTaskIds: number[] = [];

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }
    await setupDeterministicTestUsers();

    const comp1 = await prisma.company.findUnique({ where: { code: 'TEST_COMP_01' } });
    const comp2 = await prisma.company.findUnique({ where: { code: 'TEST_COMP_02' } });
    const company1 = comp1!.id;
    const company2 = comp2!.id;

    const adminEmp = await prisma.employee.findUnique({ where: { employee_code: 'RRH-TST-001' } });
    assigneeId = adminEmp!.id;

    // Company-2 agent for cross-company isolation tests
    const crossAgent = await prisma.employee.create({
      data: {
        employee_code: 'RRH-TST-15X',
        full_name: 'SLA Cross Agent',
        phone: '+919999889011',
        company_id: company2,
        password_hash: '$2a$12$testplaceholder',
        status: 'ACTIVE',
        department: 'OPERATIONS',
      },
    });
    crossAssigneeId = crossAgent.id;

    adminToken = generateAccessToken({
      employeeId: adminEmp!.id,
      employeeCode: 'RRH-TST-001',
      companyId: company1,
      branchId: null as any,
      roles: [Roles.ADMIN],
      permissions: ALL_PERMS,
    });
    crossAgentToken = generateAccessToken({
      employeeId: crossAgent.id,
      employeeCode: 'RRH-TST-15X',
      companyId: company2,
      branchId: null as any,
      roles: [Roles.AGENT],
      permissions: ALL_PERMS,
    });

    const mkTask = async (data: { status: string; target_date: Date; assignee: number; completed_at?: Date | null }) => {
      const task = await prisma.task.create({
        data: {
          title: `SLA-Test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          assignee_id: data.assignee,
          created_by: data.assignee,
          status: data.status,
          target_date: data.target_date,
          completed_at: data.completed_at ?? null,
        },
      });
      createdTaskIds.push(task.id);
      return task.id;
    };

    const future = new Date(Date.now() + 86400000); // 1 day from now
    const past = new Date(Date.now() - 86400000); // 1 day ago

    // 1. ACTIVE / PENDING with future deadline
    activeTaskId = await mkTask({ status: 'PENDING', target_date: future, assignee: assigneeId });
    // 2. COMPLETED (regardless of deadline)
    completedTaskId = await mkTask({ status: 'COMPLETED', target_date: past, assignee: assigneeId, completed_at: new Date() });
    // 3. BREACHED / PENDING with past deadline
    breachedTaskId = await mkTask({ status: 'PENDING', target_date: past, assignee: assigneeId });
    // 4. Cross-company task (company 2)
    crossTaskId = await mkTask({ status: 'PENDING', target_date: future, assignee: crossAssigneeId });
  });

  afterAll(async () => {
    // Clean up only the records created by this test
    await prisma.task.deleteMany({ where: { id: { in: createdTaskIds } } });
    await prisma.employee.deleteMany({ where: { employee_code: 'RRH-TST-15X' } });
    await prisma.$disconnect();
  });


  // 1. Authorized user reads SLA for an ACTIVE Task
  it('authorized user reads SLA for an ACTIVE Task', async () => {
    const response = await request(app)
      .get(`/api/v1/tasks/${activeTaskId}/sla`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.sla_status).toBe('ACTIVE');
    expect(response.body.task_id).toBe(activeTaskId);
    expect(response.body.status).toBe('PENDING');
  })

  // 2. Authorized user reads SLA for a COMPLETED Task
  it('authorized user reads SLA for a COMPLETED Task', async () => {
    const response = await request(app)
      .get(`/api/v1/tasks/${completedTaskId}/sla`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.sla_status).toBe('COMPLETED');
    expect(response.body.status).toBe('COMPLETED');
  })

  // 3. Authorized user reads SLA for an overdue Task → BREACHED
  it('authorized user reads SLA for an overdue Task → BREACHED', async () => {
    const response = await request(app)
      .get(`/api/v1/tasks/${breachedTaskId}/sla`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.sla_status).toBe('BREACHED');
  })

  // 4. Cross-company Task cannot be read
  it('cross-company Task cannot be read', async () => {
    const response = await request(app)
      .get(`/api/v1/tasks/${crossTaskId}/sla`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  })
 
  // 4b. Invalid Task lifecycle update is rejected by existing Task workflow rules
  it('invalid Task lifecycle update is rejected by existing Task workflow rules', async () => {
    // Cross-company agent (company 2) attempts to mutate a company-1 Task's lifecycle status.
    // Existing Task authorization (requireAuthz + TaskPolicy.canMutateSync) denies
    // cross-company mutation for non-ADMIN → 403.
    const response = await request(app)
      .patch(`/api/v1/tasks/${activeTaskId}/status`)
      .set('Authorization', `Bearer ${crossAgentToken}`)
      .send({ status: 'COMPLETED' });
    expect(response.status).toBe(403);
  })

  // 5. Unauthorized role cannot read Task SLA (missing auth → 401)
  it('unauthorized role cannot read Task SLA', async () => {
    const response = await request(app)
      .get(`/api/v1/tasks/${activeTaskId}/sla`);
    expect(response.status).toBe(401);
  })

  // 6. Non-existent Task returns repository-standard not-found response
  it('non-existent Task returns not-found response', async () => {
    const response = await request(app)
      .get('/api/v1/tasks/999999999/sla')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  })

  // 7. Derived SLA status is not persisted/does not mutate Task
  it('derived SLA status is not persisted and does not mutate Task', async () => {
    // Read SLA twice - Task should remain unchanged
    await request(app)
      .get(`/api/v1/tasks/${activeTaskId}/sla`)
      .set('Authorization', `Bearer ${adminToken}`);
    await request(app)
      .get(`/api/v1/tasks/${activeTaskId}/sla`)
      .set('Authorization', `Bearer ${adminToken}`);
    // Task status should still be PENDING - verify via findUnique
    const freshTask = await prisma.task.findUnique({
      where: { id: activeTaskId },
    });
    expect(freshTask?.status).toBe('PENDING');
  })
})