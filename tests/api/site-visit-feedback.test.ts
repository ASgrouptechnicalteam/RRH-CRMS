import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';
import * as FeedbackService from '../../apps/api/src/services/feedback.service';

// § Phase 7 — completing a site visit should request customer feedback:
// create a SiteVisitFeedback row (token hashed, never stored raw) and notify
// the telecaller with a WhatsApp link. The public GET/POST /feedback/:token
// endpoints are exercised directly against the service's own raw token
// (returned by createFeedbackRequest) rather than by re-parsing the wa.me
// link text, since that's an implementation detail of the notification, not
// of the feedback flow being tested here.
describe('Phase 7 - Site visit feedback', () => {
  let mdToken: string;
  let mdId: number;
  let leadId: number;
  let visitId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    const mdCode = deterministicUsers.find((u) => u.roles[0] === Roles.MD)!.employee_code;
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: mdCode, password: 'Password@123' });
    expect(login.status).toBe(200);
    mdToken = login.body.accessToken;
    mdId = login.body.user.id;

    const lead = await prisma.lead.create({
      data: {
        lead_code: `TEST-7-FEEDBACK-${Date.now()}`,
        company_id: (await prisma.employee.findUnique({ where: { id: mdId } }))!.company_id,
        customer_name: 'Phase 7 Feedback Test Customer',
        phone: `9${Date.now().toString().slice(-9)}`,
        source: 'MANUAL_ENTRY',
        status: 'SITE_VISIT_SCHEDULED',
        created_by_id: mdId,
      },
    });
    leadId = lead.id;

    const visit = await prisma.siteVisitBooking.create({
      data: {
        booking_code: `TEST-7-FEEDBACK-VISIT-${Date.now()}`,
        lead_id: leadId,
        telecaller_id: mdId,
        assigned_agent_id: mdId,
        scheduled_date: new Date(),
        status: 'ACTIVE',
      },
    });
    visitId = visit.id;
  });

  afterAll(async () => {
    await prisma.siteVisitFeedback.deleteMany({ where: { site_visit_id: visitId } });
    await prisma.notification.deleteMany({
      where: {
        employee_id: mdId,
        type: { in: ['SITE_VISIT_FEEDBACK_READY', 'SITE_VISIT_FEEDBACK_SUBMITTED'] },
      },
    });
    await prisma.siteVisitBooking.deleteMany({ where: { id: visitId } });
    await prisma.leadActivity.deleteMany({ where: { lead_id: leadId } });
    await prisma.lead.delete({ where: { id: leadId } });
  });

  it('completing the visit creates a feedback request and notifies the telecaller', async () => {
    const res = await request(app)
      .post(`/api/v1/site-visits/${visitId}/complete`)
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ outcomes: [], feedback_notes: 'Went well.' });

    expect(res.status).toBe(200);
    expect(res.body.visit.status).toBe('COMPLETED');

    const feedback = await prisma.siteVisitFeedback.findUnique({
      where: { site_visit_id: visitId },
    });
    expect(feedback).not.toBeNull();
    expect(feedback!.rated_employee_id).toBe(mdId);
    expect(feedback!.submitted_at).toBeNull();
    expect(feedback!.expires_at.getTime()).toBeGreaterThan(Date.now());

    const notif = await prisma.notification.findFirst({
      where: { employee_id: mdId, type: 'SITE_VISIT_FEEDBACK_READY' },
    });
    expect(notif).not.toBeNull();
    expect(notif!.message).toContain('Phase 7 Feedback Test Customer');
  });

  it('does not create a second feedback request if a visit somehow completes twice (unique constraint)', async () => {
    // completeVisit's own workflow guard already prevents re-completing a
    // COMPLETED visit, but this asserts the DB-level invariant the whole
    // design leans on: one feedback row per visit, ever.
    await expect(
      prisma.siteVisitFeedback.create({
        data: {
          site_visit_id: visitId,
          rated_employee_id: mdId,
          token_hash: 'duplicate-test-hash',
          expires_at: new Date(Date.now() + 1000),
        },
      }),
    ).rejects.toThrow();
  });

  describe('public token endpoints (against a fresh feedback request)', () => {
    let token: string;
    let freshVisitId: number;

    beforeAll(async () => {
      const visit = await prisma.siteVisitBooking.create({
        data: {
          booking_code: `TEST-7-FEEDBACK-PUBLIC-${Date.now()}`,
          lead_id: leadId,
          telecaller_id: mdId,
          scheduled_date: new Date(),
          status: 'ACTIVE',
        },
      });
      freshVisitId = visit.id;
      token = await prisma.$transaction((tx) =>
        FeedbackService.createFeedbackRequest(tx, freshVisitId, mdId),
      );
    });

    afterAll(async () => {
      await prisma.siteVisitFeedback.deleteMany({ where: { site_visit_id: freshVisitId } });
      await prisma.siteVisitBooking.delete({ where: { id: freshVisitId } });
    });

    it('GET returns the rated employee name and alreadySubmitted: false for a fresh token', async () => {
      const res = await request(app).get(`/api/v1/feedback/${token}`);
      expect(res.status).toBe(200);
      expect(res.body.alreadySubmitted).toBe(false);
      expect(typeof res.body.ratedEmployeeName).toBe('string');
    });

    it('GET 404s for a garbage token', async () => {
      const res = await request(app).get('/api/v1/feedback/not-a-real-token');
      expect(res.status).toBe(404);
    });

    it('POST rejects a rating outside 1-5', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/${token}`)
        .send({ rating: 7, onTime: true, answeredQuestions: true, propertyAsDescribed: true });
      expect(res.status).toBe(400);
    });

    it('POST accepts a valid submission, and a second POST is rejected as already submitted', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/${token}`)
        .send({
          rating: 5,
          onTime: true,
          answeredQuestions: true,
          propertyAsDescribed: false,
          comment: 'Great visit!',
        });
      expect(res.status).toBe(200);

      const stored = await prisma.siteVisitFeedback.findUnique({
        where: { site_visit_id: freshVisitId },
      });
      expect(stored!.submitted_at).not.toBeNull();
      expect(stored!.rating).toBe(5);
      expect(stored!.comment).toBe('Great visit!');

      const again = await request(app)
        .post(`/api/v1/feedback/${token}`)
        .send({ rating: 4, onTime: true, answeredQuestions: true, propertyAsDescribed: true });
      expect(again.status).toBe(409);

      // Submitting notifies the rated employee's manager + all MDs — mdId
      // has no reporting_manager_id in the deterministic fixtures, but is
      // itself an MD, so it should receive its own submission notification.
      const submittedNotif = await prisma.notification.findFirst({
        where: { employee_id: mdId, type: 'SITE_VISIT_FEEDBACK_SUBMITTED' },
      });
      expect(submittedNotif).not.toBeNull();
    });

    it('GET now reports alreadySubmitted: true', async () => {
      const res = await request(app).get(`/api/v1/feedback/${token}`);
      expect(res.status).toBe(200);
      expect(res.body.alreadySubmitted).toBe(true);
    });

    // Asserted here, before this describe's afterAll deletes the row it's
    // checking for — the outer "GET /feedback/team" describe runs after
    // this block's afterAll has already cleaned up.
    it('an MD sees company-wide submitted feedback, including the one just submitted', async () => {
      const res = await request(app)
        .get('/api/v1/feedback/team')
        .set('Authorization', `Bearer ${mdToken}`);
      expect(res.status).toBe(200);
      expect(res.body.items.some((i: any) => i.comment === 'Great visit!')).toBe(true);
    });
  });

  describe('GET /feedback/team', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/feedback/team');
      expect(res.status).toBe(401);
    });
  });
});
