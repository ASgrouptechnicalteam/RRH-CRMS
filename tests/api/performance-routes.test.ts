import request from 'supertest';
import app from '../../apps/api/src/server';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';

/**
 * Phase 16 V1 — Packet A: Performance Route Closure Test.
 *
 * READ-ONLY verification of Packet A centralization: exercises the REAL Express
 * app + DB-backed `/performance` endpoints to prove the route delegates to the
 * centralized metric service and preserves response contracts + authorization.
 *
 * Deterministic fixture (seeded for the deterministic MD employee only):
 *   - 2 completed tasks  -> +2.0  (taskBoost)
 *   - 1 daily report     -> +0.5  (reportBoost)
 *   - 1 PRESENT attend.  -> +0.5  (presentBoost)
 *   - 1 LATE attend.     -> -1.0  (latePenalty)
 *   - 0 overdue / below-target / uninformed-absent / half-day
 *
 *  FULL formula (my-score & team):  50 + 2.0 + 0.5 + 0.5 - 1.0 = 52.0
 *  REDUCED leaderboard formula:     50 + 2.0 + 0.5               = 52.5
 * (The 0.5 gap proves attendance+penalties are excluded from the leaderboard.)
 */
const EXPECTED_FULL_SCORE = 52.0; // 50 + 2 + 0.5 + 0.5 - 1
const EXPECTED_LEADERBOARD_SCORE = 52.5; // 50 + 2 + 0.5 (reduced)

const prisma = new PrismaClient();

describe('Phase 16 Packet A — /performance route integration', () => {
  let mdToken: string;
  let mdId: number;
  let mdEmployeeCode: string;
  const created = {
    taskIds: [] as number[],
    reportId: null as number | null,
    attendanceIds: [] as number[],
  };

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against the isolated test database.');
    }

    await setupDeterministicTestUsers();

    const mdUser = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!;
    mdEmployeeCode = mdUser.employee_code;

    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.10.99')
      .send({ employee_code: mdUser.employee_code, password: 'Password@123' });
    expect(login.status).toBe(200);
    mdToken = login.body.accessToken;

    const emp = await prisma.employee.findUnique({ where: { employee_code: mdEmployeeCode } });
    expect(emp).toBeDefined();
    mdId = emp!.id;

    // Employee-scoped isolation: clear only THIS employee's performance events so
    // counts are deterministic regardless of any stale test_db rows. Matches the
    // scope of the route queries (assignee_id / employee_id / actor_id).
    await prisma.task.deleteMany({ where: { assignee_id: mdId } });
    await prisma.dailyReport.deleteMany({ where: { employee_id: mdId } });
    await prisma.attendanceLog.deleteMany({ where: { employee_id: mdId } });
    await prisma.auditEvent.deleteMany({ where: { actor_id: mdId } });

    // Seed the deterministic dataset for the MD employee.
    const t1 = await prisma.task.create({
      data: {
        title: 'PT-CLOSE-Completed-1',
        assignee: { connect: { id: mdId } },
        target_date: new Date(),
        created_by: mdId,
        status: 'COMPLETED',
        completed_at: new Date(),
      },
    });
    const t2 = await prisma.task.create({
      data: {
        title: 'PT-CLOSE-Completed-2',
        assignee: { connect: { id: mdId } },
        target_date: new Date(),
        created_by: mdId,
        status: 'COMPLETED',
        completed_at: new Date(),
      },
    });
    created.taskIds = [t1.id, t2.id];

    const report = await prisma.dailyReport.create({
      data: { employee: { connect: { id: mdId } }, summary: 'PT-CLOSE-DailyReport-1' },
    });
    created.reportId = report.id;

    const present = await prisma.attendanceLog.create({
      data: { employee: { connect: { id: mdId } }, status: 'PRESENT' },
    });
    const late = await prisma.attendanceLog.create({
      data: { employee: { connect: { id: mdId } }, status: 'LATE' },
    });
        created.attendanceIds = [present.id, late.id];
  });

  afterAll(async () => {
    // Targeted cleanup: delete ONLY the rows created by this test (by id), in
    // dependency-safe order. Leaves all other test_db data untouched.
    if (created.attendanceIds.length) {
      await prisma.attendanceLog.deleteMany({ where: { id: { in: created.attendanceIds } } });
    }
    if (created.reportId) {
      await prisma.dailyReport.delete({ where: { id: created.reportId } });
    }
    if (created.taskIds.length) {
      await prisma.task.deleteMany({ where: { id: { in: created.taskIds } } });
    }
    await prisma.$disconnect();
  });

  describe('GET /api/v1/performance/my-score', () => {
    it('returns 200 with the centralized FULL score (52.0) from seeded events', async () => {
      const res = await request(app)
        .get('/api/v1/performance/my-score')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(EXPECTED_FULL_SCORE);
      // Response shape preserved (Packet A must not change the contract).
      expect(res.body.employeeId).toBe(mdId);
      expect(res.body.breakdown).toBeDefined();
      expect(res.body.breakdown.baseScore).toBe(50);
      // Components derived from the deterministic fixture.
      expect(res.body.breakdown.taskEvents).toBe(2);
      expect(res.body.breakdown.taskBoost).toBe(2);
      expect(res.body.breakdown.reportEvents).toBe(1);
      expect(res.body.breakdown.presentCount).toBe(1);
      expect(res.body.breakdown.presentBoost).toBe(0.5);
      expect(res.body.breakdown.lateCount).toBe(1);
      expect(res.body.breakdown.latePenalty).toBe(1);
      expect(res.body.breakdown.halfDayCount).toBe(0);
      expect(res.body.breakdown.belowTargetEvents).toBe(0);
      expect(res.body.breakdown.uninformedAbsentEvents).toBe(0);
    });

    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).get('/api/v1/performance/my-score');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/performance/team', () => {
    it('returns 200 with the MD employee at 52.0 and zone SATISFACTORY (52 >= 41, < 66)', async () => {
      const res = await request(app)
        .get('/api/v1/performance/team')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.team)).toBe(true);
      const entry = res.body.team.find((e: any) => e.employeeCode === mdEmployeeCode);
      expect(entry).toBeDefined();
      expect(entry.score).toBe(EXPECTED_FULL_SCORE);
      // Zone thresholds are unchanged (Packet A must not alter them).
      expect(entry.zone).toBe('SATISFACTORY');
      expect(entry.breakdown).toMatchObject({
        tasksDone: 2,
        reportsDone: 1,
        presentCount: 1,
        lateCount: 1,
        tasksOverdue: 0,
        belowTargetCount: 0,
        halfDayCount: 0,
        uninformedAbsent: 0,
      });
    });
  });

  describe('GET /api/v1/performance/leaderboard', () => {
    it('uses the REDUCED formula (52.5) — attendance & penalties excluded', async () => {
      const res = await request(app)
        .get('/api/v1/performance/leaderboard')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.leaderboard)).toBe(true);
      const entry = res.body.leaderboard.find((e: any) => e.employeeCode === mdEmployeeCode);
      expect(entry).toBeDefined();

      // Reduced = 50 + 2 tasks + 1 report = 52.5 (intentionally different from 52.0).
      expect(entry.score).toBe(EXPECTED_LEADERBOARD_SCORE);
      expect(entry.score).toBe(52.5);
      expect(entry.tasksCompleted).toBe(2);

      // The leaderboard contract must NOT expose attendance/penalty fields.
      expect(entry).not.toHaveProperty('presentCount');
      expect(entry).not.toHaveProperty('lateCount');
      expect(entry).not.toHaveProperty('belowTargetCount');
    });

    it('orders entries by score descending (highest first)', async () => {
      const res = await request(app)
        .get('/api/v1/performance/leaderboard')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      const scores: number[] = res.body.leaderboard.map((e: any) => e.score);
      expect(scores).toEqual([...scores].sort((a: number, b: number) => b - a));
    });

    it('Packet D: rejects callers without PERFORMANCE_READ_TEAM (403)', async () => {
      // RRH-TST-005 is a TELECALLER (no PERFORMANCE_READ_TEAM, not ADMIN).
      const tcUser = deterministicUsers.find((u) => u.employee_code === 'RRH-TST-005')!;
      const login = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '192.168.10.99')
        .send({ employee_code: tcUser.employee_code, password: 'Password@123' });
      expect(login.status).toBe(200);
      const res = await request(app)
        .get('/api/v1/performance/leaderboard')
        .set('Authorization', `Bearer ${login.body.accessToken}`);
      expect(res.status).toBe(403);
    });
  });

  // Packet D (15-16): Cross-company isolation proofs for the three remediated endpoints.
  describe('Packet D — /performance company isolation', () => {
    // RRH-TST-999 is the deterministic Company-2 employee (crossOrgUsers, company_id 2).
    const crossCompanyCode = 'RRH-TST-999';

    it('leaderboard is company-scoped: Company-B employee is absent for Company-A MD', async () => {
      const res = await request(app)
        .get('/api/v1/performance/leaderboard')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      const codes = res.body.leaderboard.map((e: any) => e.employeeCode);
      expect(codes).toContain(mdEmployeeCode); // Company-A (MD) employee present
      expect(codes).not.toContain(crossCompanyCode); // Company-B employee MUST be absent
    });

    it('team is company-scoped: Company-B employee is absent for Company-A MD', async () => {
      const res = await request(app)
        .get('/api/v1/performance/team')
        .set('Authorization', `Bearer ${mdToken}`);

      expect(res.status).toBe(200);
      const codes = res.body.team.map((e: any) => e.employeeCode);
      expect(codes).toContain(mdEmployeeCode);
      expect(codes).not.toContain(crossCompanyCode);
    });

    it('leaderboard still 200 for an authorized Company-A Marketing Director', async () => {
      // RRH-TST-002 = MARKETING_DIRECTOR (has PERFORMANCE_READ_TEAM).
      const mdUser2 = deterministicUsers.find((u) => u.employee_code === 'RRH-TST-002')!;
      const login = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '192.168.10.99')
        .send({ employee_code: mdUser2.employee_code, password: 'Password@123' });
      expect(login.status).toBe(200);
      const res = await request(app)
        .get('/api/v1/performance/leaderboard')
        .set('Authorization', `Bearer ${login.body.accessToken}`);
      expect(res.status).toBe(200);
    });
  });
});
