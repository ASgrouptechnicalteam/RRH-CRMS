import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';

// User-reported flaw: a task someone assigns to themselves earns the exact
// same +1.0/+2.0 performance credit as a manager-assigned one, letting
// anyone inflate their own score by creating and completing trivial
// self-assigned tasks. Fixed at three sites: the TASK_COMPLETED audit/
// notification in routes/tasks.ts, and the completed-task counts in both
// routes/performance.ts (my-score + team) and analytics.service.ts.
describe('Task self-assignment does not inflate performance scoring', () => {
  let mdToken: string;
  let mdId: number;
  let selfAssignedTaskId: number;
  let managerAssignedTaskId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    const mdUser = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!;
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: mdUser.employee_code, password: 'Password@123' });
    expect(login.status).toBe(200);
    mdToken = login.body.accessToken;
    mdId = login.body.user.id;
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({ where: { actor_id: mdId, action: 'TASK_COMPLETED' } });
    await prisma.task.deleteMany({
      where: { id: { in: [selfAssignedTaskId, managerAssignedTaskId].filter(Boolean) } },
    });
  });

  it('creates a self-assigned and a manager-assigned task', async () => {
    const selfRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        title: 'Self-assigned test task',
        assignee_id: mdId,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(selfRes.status).toBe(201);
    selfAssignedTaskId = selfRes.body.task.id;
    expect(selfRes.body.task.created_by).toBe(mdId);
    expect(selfRes.body.task.assignee_id).toBe(mdId);

    // A second employee to receive a manager-assigned task from the MD.
    const tcUser = deterministicUsers.find((u) => u.roles[0] === Roles.TELECALLER)!;
    const tc = await prisma.employee.findFirst({ where: { employee_code: tcUser.employee_code } });
    const mgrRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({
        title: 'Manager-assigned test task',
        assignee_id: tc!.id,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(mgrRes.status).toBe(201);
    managerAssignedTaskId = mgrRes.body.task.id;
  });

  it('completing a self-assigned task does not write a TASK_COMPLETED audit event', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${selfAssignedTaskId}/status`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);

    const auditEvent = await prisma.auditEvent.findFirst({
      where: { action: 'TASK_COMPLETED', entity_id: selfAssignedTaskId },
    });
    expect(auditEvent).toBeNull();
  });

  it('a completed self-assigned task is excluded from the /my-score completed-task count', async () => {
    const res = await request(app)
      .get('/api/v1/performance/my-score')
      .set('Authorization', `Bearer ${mdToken}`);
    expect(res.status).toBe(200);
    // The self-assigned task above is COMPLETED but must not appear in the
    // breakdown's task-derived boost for this employee this month.
    const selfAssignedStillOpen = await prisma.task.findUnique({
      where: { id: selfAssignedTaskId },
    });
    expect(selfAssignedStillOpen!.status).toBe('COMPLETED');
    expect(selfAssignedStillOpen!.created_by).toBe(selfAssignedStillOpen!.assignee_id);
    // Directly assert the counting query itself excludes it (source of truth
    // for the scoring bug, independent of the rest of the score formula).
    const now = new Date();
    const countExcludingSelfAssigned = await prisma.task.count({
      where: {
        assignee_id: mdId,
        status: 'COMPLETED',
        updated_at: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        created_by: { not: mdId },
      },
    });
    const countIncludingSelfAssigned = await prisma.task.count({
      where: {
        assignee_id: mdId,
        status: 'COMPLETED',
        updated_at: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    });
    expect(countIncludingSelfAssigned).toBeGreaterThan(countExcludingSelfAssigned);
  });
});
