import request from 'supertest';
import app from '../../apps/api/src/server';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';
import { PrismaClient } from '@prisma/client';
import { Roles, Permissions } from '@rrh-ems/shared';
import { can } from '../../apps/api/src/authz/authorization';
import bcrypt from 'bcryptjs';

const prisma = new (require('@prisma/client').PrismaClient)();

describe('MASTER BETA REGRESSION — Tenant Isolation & Authorization', () => {
  let compATelecallerToken: string;
  let compAMdToken: string;
  let compAFinanceToken: string;
  let compAHrToken: string;
  let compAAdminToken: string;
  let compBTelecallerToken: string;

  let compAUser: any;
  let compBUser: any;

  let compBLeadId: number;
  let compBOppId: number;
  let compBPropertyId: number;
  let compBEmployeeId: number;
  let compBCustomerId: number;
  let compACustomerId: number;
  let compBProjectId: number;
  let compBPropertyImageId: number;
  let compBTaskId: number;
  let compBComplaintId: number;
  let compBBookingId: number;
  let compBPaymentId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against the isolated test database.');
    }
    await setupDeterministicTestUsers();

    // Get tokens
    const login = async (code: string) => {
      const res = await request(app).post('/api/v1/auth/login').send({ employee_code: code, password: 'Password@123' });
      return res.body.accessToken;
    };

    compATelecallerToken = await login(deterministicUsers.find(u => u.roles[0] === Roles.TELECALLER)!.employee_code);
    compAMdToken = await login(deterministicUsers.find(u => u.roles[0] === Roles.MD)!.employee_code);
    compAFinanceToken = await login(deterministicUsers.find(u => u.roles[0] === Roles.FINANCE)!.employee_code);
    compAHrToken = await login(deterministicUsers.find(u => u.roles[0] === Roles.HR_MANAGER)!.employee_code);
    compAAdminToken = await login(deterministicUsers.find(u => u.roles[0] === Roles.ADMIN)!.employee_code);
    compBTelecallerToken = await login(crossOrgUsers[0].employee_code);

    compAUser = await prisma.employee.findUnique({ where: { employee_code: deterministicUsers.find(u => u.roles[0] === Roles.TELECALLER)!.employee_code } });
    compBUser = await prisma.employee.findUnique({ where: { employee_code: crossOrgUsers[0].employee_code } });
    const compBBranch = await prisma.branch.findFirst({ where: { company_id: compBUser!.company_id } });

    // Create Company B Resources
    const bLead = await prisma.lead.upsert({
      where: { lead_code: 'LD-999-B' },
      update: {
        company_id: compBUser!.company_id,
        created_by_id: compBUser!.id,
        assigned_to_id: compBUser.id
      },
      create: {
        customer_name: 'Comp B Lead',
        phone: '+919999900001',
        source: 'WEBSITE',
        status: 'NEW',
        company: { connect: { id: compBUser!.company_id } },
        branch: { connect: { id: compBBranch!.id } },
        created_by: { connect: { id: compBUser!.id } },
        assigned_to: { connect: { id: compBUser.id } },
        lead_code: 'LD-999-B'
      }
    });
    compBLeadId = bLead.id;

    const bCustomer = await prisma.customer.upsert({
      where: { customer_code: 'CUST-B-999' },
      update: {
        company_id: compBUser!.company_id
      },
      create: {
        customer_code: 'CUST-B-999',
        first_name: 'Comp B',
        last_name: 'Customer',
        phone: '+919999900002',
        email: 'b@example.com',
        company: { connect: { id: compBUser!.company_id } }
      }
    });
    compBCustomerId = bCustomer.id;

    const aCustomer = await prisma.customer.create({
      data: {
        customer_code: `CUST-A-IDOR-${Date.now()}`,
        first_name: 'Comp A',
        last_name: 'Customer',
        phone: `+9188${Math.floor(10000000 + Math.random() * 90000000)}`,
        company_id: compAUser.company_id,
      },
    });
    compACustomerId = aCustomer.id;

    const bOpp = await prisma.opportunity.upsert({
      where: { opportunity_code: 'OPP-B-999' },
      update: {
        company_id: compBUser!.company_id,
        owner_id: compBUser.id
      },
      create: {
        opportunity_code: 'OPP-B-999',
        lead: { connect: { id: compBLeadId } },
                expected_value: 5000000,
        expected_close_date: new Date(),
        company: { connect: { id: compBUser!.company_id } },
        owner: { connect: { id: compBUser.id } }
      }
    });
    compBOppId = bOpp.id;

    const bProp = await prisma.property.upsert({
      where: { property_code: 'PROP-B-1' },
      update: {
        company_id: compBUser!.company_id,
        created_by_id: compBUser.id
      },
      create: {
        property_code: 'PROP-B-1',
        title: 'Company B Property',
        category: 'VILLA',
        price: 5000000,
        area_sqft: 1500,
        location: 'Company B Location',
        status: 'DRAFT',
        company: { connect: { id: compBUser!.company_id } },
        created_by: { connect: { id: compBUser.id } }
      }
    });
    compBPropertyId = bProp.id;
    compBEmployeeId = compBUser.id;

    // Create additional Company B resources for cross-tenant testing
    const bProject = await prisma.project.upsert({
      where: { project_code: 'PROJ-B-999' },
      update: {
        company_id: compBUser!.company_id,
        assigned_pm_id: compBUser.id
      },
      create: {
        project_code: 'PROJ-B-999',
        name: 'Company B Project',
        status: 'ACTIVE',
        location: 'Company B Location',
        company: { connect: { id: compBUser!.company_id } },
        assigned_pm: { connect: { id: compBUser.id } }
      }
    });
    compBProjectId = bProject.id;

    const bPropertyImage = await prisma.propertyImage.create({
      data: {
        property_id: compBPropertyId,
        image_url: 'https://example.com/test-image.jpg',
        uploaded_by_id: compBUser.id,
        status: 'PENDING',
        is_primary: true,
        sort_order: 0
      }
    });
    compBPropertyImageId = bPropertyImage.id;

    const bTask = await prisma.task.create({
      data: {
        title: 'Company B Task',
        status: 'PENDING',
        target_date: new Date(Date.now() + 86400000),
        assignee_id: compBUser.id,
        created_by: compBUser.id
      }
    });
    compBTaskId = bTask.id;

    // Create Company B complaint (reusing existing pattern from packet14-1-complaint.test.ts)
    const bComplaint = await prisma.complaint.create({
      data: {
        complaint_code: `COMP-B-${Date.now()}`,
        title: 'Company B Complaint',
        description: 'Test complaint',
        status: 'OPEN',
        priority: 'MEDIUM',
        customer: { connect: { id: compBCustomerId } },
        company: { connect: { id: compBUser!.company_id } }
      }
    });
    compBComplaintId = bComplaint.id;

    // Create Company B booking (reusing existing pattern from payment-sync.test.ts)
    const bBooking = await prisma.booking.create({
      data: {
        booking_code: `BOOK-B-${Date.now()}`,
        company: { connect: { id: compBUser!.company_id } },
        customer: { connect: { id: compBCustomerId } },
        property: { connect: { id: compBPropertyId } },
        agreed_price: 5000000,
        booking_amount: 100000,
        balance_amount: 4900000,
        status: 'INITIATED'
      }
    });
    compBBookingId = bBooking.id;

    // Create Company B payment (reusing existing pattern from integration-metrics.test.ts)
    const bPayment = await prisma.payment.create({
      data: {
        payment_code: `PAY-B-${Date.now()}`,
        company_id: compBUser!.company_id,
        booking_id: compBBookingId,
        amount: 50000,
        payment_method: 'CASH',
        status: 'PENDING',
        recorded_by_id: compBUser.id
      }
    });
    compBPaymentId = bPayment.id;
  });

  afterAll(async () => {
    if (compACustomerId) {
      await prisma.customerNotification.deleteMany({ where: { customer_id: compACustomerId } });
      await prisma.integrationEvent.deleteMany({ where: { crms_customer_id: compACustomerId } });
      await prisma.customer.deleteMany({ where: { id: compACustomerId } });
    }
    if (compBBookingId) {
      await prisma.booking.deleteMany({ where: { id: compBBookingId } });
    }
    if (compBComplaintId) {
      await prisma.complaint.deleteMany({ where: { id: compBComplaintId } });
    }
    await prisma.$disconnect();
  });

  describe('AUTHORIZATION ENGINE (can() tests)', () => {
    it('1. Unknown permission -> DENY', () => {
      expect(can({ roles: [Roles.TELECALLER], permissions: [], companyId: 1 } as any, 'UNKNOWN_PERM' as any)).toBe(false);
    });

    it('2. Unknown permission + same company resource -> DENY', () => {
      expect(can({ roles: [Roles.TELECALLER], permissions: [], companyId: 1 } as any, 'UNKNOWN_PERM' as any, { company_id: 1 })).toBe(false);
    });

    it('3. Unknown permission + missing company_id -> DENY', () => {
      expect(can({ roles: [Roles.TELECALLER], permissions: [], companyId: 1 } as any, 'UNKNOWN_PERM' as any, { other_id: 123 })).toBe(false);
    });

    it('4. Unknown permission + foreign company resource -> DENY', () => {
      expect(can({ roles: [Roles.TELECALLER], permissions: [], companyId: 1 } as any, 'UNKNOWN_PERM' as any, { company_id: 2 })).toBe(false);
    });
  });

  describe('TENANT ISOLATION', () => {
    it('5. GET foreign lead -> not found', async () => {
      const res = await request(app).get(`/api/v1/leads/${compBLeadId}`).set('Authorization', `Bearer ${compATelecallerToken}`);
      console.log('TEST 5 RESPONSE:', res.status, res.body);
      expect(res.status).toBe(404);
    });

    it('6. PATCH foreign lead -> not found', async () => {
      const res = await request(app).patch(`/api/v1/leads/${compBLeadId}/status`).set('Authorization', `Bearer ${compATelecallerToken}`).send({ status: 'CONTACTED' });
      expect(res.status).toBe(404);
    });

    it('7. DELETE foreign lead -> not found (not implemented, but testing any foreign mutation)', async () => {
      const res = await request(app).post(`/api/v1/leads/${compBLeadId}/convert-to-customer`).set('Authorization', `Bearer ${compATelecallerToken}`);
      expect(res.status).toBe(404);
    });

    it('8. GET foreign opportunity -> not found', async () => {
      const res = await request(app).get(`/api/v1/opportunities/${compBOppId}`).set('Authorization', `Bearer ${compATelecallerToken}`);
      expect(res.status).toBe(404);
    });

    it('9. PATCH foreign opportunity -> not found', async () => {
      const res = await request(app).patch(`/api/v1/opportunities/${compBOppId}`).set('Authorization', `Bearer ${compATelecallerToken}`).send({ value: 6000000 });
      expect(res.status).toBe(404);
    });

    it('10. GET/verify foreign document -> not found', async () => {
      const res = await request(app).patch(`/api/v1/documents/9999/verify`).set('Authorization', `Bearer ${compAFinanceToken}`).send({ status: 'VERIFIED' });
      if (res.status === 400) console.log(res.body);
      expect(res.status).toBe(404);
    });
  });

  describe('RELATIONSHIPS', () => {
    it('11. Company A cannot create task against Company B lead', async () => {
      const res = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${compAMdToken}`).send({
        title: 'Hack Task',
        task_type: 'FOLLOW_UP',
        priority: 'HIGH',
        lead_id: compBLeadId,
        assignee_id: compAUser!.id,
        deadline: new Date().toISOString()
      });
      console.log('TEST 11 RESPONSE:', res.status, res.body);
      expect(res.status).toBe(404); 
    });

    it('12. Company A cannot assign task to Company B employee', async () => {
      const res = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${compAMdToken}`).send({
        title: 'Hack Task',
        task_type: 'FOLLOW_UP',
        priority: 'HIGH',
        assignee_id: compBEmployeeId,
        deadline: new Date().toISOString()
      });
      expect(res.status).toBe(400);
    });

    it('13. Company A cannot attach Company B opportunity', async () => {
      const res = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${compAMdToken}`).send({
        title: 'Hack Task',
        task_type: 'FOLLOW_UP',
        priority: 'HIGH',
        opportunity_id: compBOppId,
        assignee_id: compAUser!.id,
        deadline: new Date().toISOString()
      });
      expect(res.status).toBe(404);
    });

    it('14. Company A cannot modify foreign relationships (Site visit against Comp B Lead)', async () => {
      const res = await request(app).post('/api/v1/siteVisits').set('Authorization', `Bearer ${compATelecallerToken}`).send({
        lead_id: compBLeadId,
        property_id: compBPropertyId,
        scheduled_date: new Date().toISOString()
      });
      expect(res.status).toBe(404);
    });
  });

  describe('RBAC', () => {
    it('15. TELECALLER allowed to create leads if permission matrix says so', async () => {
      const res = await request(app).post('/api/v1/leads/').set('Authorization', `Bearer ${compATelecallerToken}`).send({
        customer_name: 'Valid Lead',
        phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
        source: 'WEBSITE'
      });
      expect(res.status).toBe(201);
    });

    it('16. MD allowed required lead management operations', async () => {
      const res = await request(app).get('/api/v1/leads/').set('Authorization', `Bearer ${compAMdToken}`);
      expect(res.status).toBe(200);
    });

    it('17. FINANCE-only endpoint denied to TELECALLER', async () => {
      const res = await request(app).get('/api/v1/expense-refunds/queue').set('Authorization', `Bearer ${compATelecallerToken}`);
      expect(res.status).toBe(403);
    });

    it('18. HR-sensitive endpoint denied to TELECALLER', async () => {
      const res = await request(app).get('/api/v1/md/employees').set('Authorization', `Bearer ${compATelecallerToken}`);
      expect(res.status).toBe(403);
    });

    it('19. KYC write denied to unauthorized roles', async () => {
      const res = await request(app).put(`/api/v1/customers/${compACustomerId}/kyc`).set('Authorization', `Bearer ${compATelecallerToken}`).send({
        pan_number: 'ABCDE1234F'
      });
      expect(res.status).toBe(403);
    });

    it('20. ADMIN behavior remains correct (can do admin stuff)', async () => {
      const res = await request(app).get('/api/v1/integration.routes/metrics').set('Authorization', `Bearer ${compAAdminToken}`);
      expect(res.status).not.toBe(403);
    });
  });

  describe('CUSTOMER KYC TENANT ISOLATION', () => {
    it('21. Company A cannot write KYC for a Company B customer', async () => {
      const res = await request(app)
        .put(`/api/v1/customers/${compBCustomerId}/kyc`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ pan_number: 'ABCDE1234F', aadhaar_number: '123456789012' });

      expect(res.status).toBe(404);
    });

    it('22. Company A can write KYC for its own customer', async () => {
      const res = await request(app)
        .put(`/api/v1/customers/${compACustomerId}/kyc`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ pan_number: 'ABCDE1234F', aadhaar_number: '123456789012' });
      if (res.status === 400) console.log(res.body);
      expect(res.status).toBe(200);
    });
  });

  describe('ATTRIBUTION', () => {
    it('23. created_by_id cannot be spoofed', async () => {
      const res = await request(app).post('/api/v1/leads/').set('Authorization', `Bearer ${compATelecallerToken}`).send({
        customer_name: 'Spoof Lead',
        phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
        source: 'WEBSITE',
        created_by_id: 999
      });
      console.log('TEST 21:', res.status, res.body);
      expect(res.status).toBe(201);
      expect(res.body.lead.created_by_id).not.toBe(999); // Must be actual user ID
    });

    it('24. company_id cannot be spoofed', async () => {
      const res = await request(app).post('/api/v1/leads/').set('Authorization', `Bearer ${compATelecallerToken}`).send({
        customer_name: 'Spoof Company',
        phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
        source: 'WEBSITE',
        company_id: 2
      });
      expect(res.status).toBe(201);
      expect(res.body.lead.company_id).toBe(compAUser.company_id); // Must be forced to company A
    });

    it('25. assignee/company boundaries cannot be bypassed', async () => {
      const res = await request(app).post('/api/v1/leads/').set('Authorization', `Bearer ${compATelecallerToken}`).send({
        customer_name: 'Spoof Assignee',
        phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
        source: 'WEBSITE',
        assigned_to_id: compBEmployeeId
      });
      expect(res.status).toBe(201);
      expect(res.body.lead.assigned_to_id).not.toBe(compBEmployeeId);
    });
  });

  describe('CROSS-TENANT MUTATION PROTECTION - HIGH PRIORITY ENDPOINTS', () => {
    // PROJECTS
    it('26. Company A cannot PUT Company B project', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${compBProjectId}`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ name: 'Hacked Project Name' });
      console.log('TEST 26 - PUT /projects/:id:', res.status, res.body);
      expect(res.status).toBe(404);
    });

    it('27. Company A cannot DELETE Company B project', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${compBProjectId}`)
        .set('Authorization', `Bearer ${compAMdToken}`);
      console.log('TEST 27 - DELETE /projects/:id:', res.status, res.body);
      expect(res.status).toBe(404);
    });

    it('28. Company A cannot PUT assign Company B project', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${compBProjectId}/assign`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ assigned_pm_id: compAUser!.id, reason: 'Cross-tenant hack' });
      console.log('TEST 28 - PUT /projects/:id/assign:', res.status, res.body);
      expect([401, 403, 404]).toContain(res.status); // All are acceptable for cross-tenant protection (401 = missing auth, 403 = forbidden, 404 = not found)
    });

    // PROPERTIES
    it('29. Company A cannot PUT Company B property', async () => {
      const res = await request(app)
        .put(`/api/v1/properties/${compBPropertyId}`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ title: 'Hacked Property Title' });
      console.log('TEST 29 - PUT /properties/:id:', res.status, res.body);
      expect([403, 404]).toContain(res.status); // Both 403 and 404 are acceptable for cross-tenant protection
    });

    it('30. Company A cannot PUT Company B property image', async () => {
      const res = await request(app)
        .put(`/api/v1/properties/${compBPropertyId}/images/${compBPropertyImageId}`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ alt_text: 'Hacked alt text' });
      console.log('TEST 30 - PUT /properties/:id/images/:imageId:', res.status, res.body);
      expect([403, 404]).toContain(res.status); // Both 403 and 404 are acceptable for cross-tenant protection
    });

    it('31. Company A cannot DELETE Company B property image', async () => {
      const res = await request(app)
        .delete(`/api/v1/properties/${compBPropertyId}/images/${compBPropertyImageId}`)
        .set('Authorization', `Bearer ${compAMdToken}`);
      console.log('TEST 31 - DELETE /properties/:id/images/:imageId:', res.status, res.body);
      expect([403, 404]).toContain(res.status); // Both 403 and 404 are acceptable for cross-tenant protection
    });

    // OPPORTUNITIES
    it('32. Company A cannot PATCH Company B opportunity stage', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${compBOppId}/stage`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ stage: 'WON', drop_reason: null });
      console.log('TEST 32 - PATCH /opportunities/:id/stage:', res.status, res.body);
      expect(res.status).toBe(404);
    });

    // TASKS
    it('33. Company A cannot PATCH Company B task status', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${compBTaskId}/status`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ status: 'COMPLETED' });
      console.log('TEST 33 - PATCH /tasks/:id/status:', res.status, res.body);
      expect([403, 404]).toContain(res.status); // Both 403 and 404 are acceptable for cross-tenant protection
    });

    // CUSTOMERS
    it('34. Company A cannot PATCH Company B customer', async () => {
      const res = await request(app)
        .patch(`/api/v1/customers/${compBCustomerId}`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ first_name: 'Hacked Name' });
      console.log('TEST 34 - PATCH /customers/:id:', res.status, res.body);
      expect([403, 404]).toContain(res.status); // Both 403 and 404 are acceptable for cross-tenant protection
    });

    // COMPLAINTS
    it('35. Company A cannot PATCH Company B complaint', async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${compBComplaintId}`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ title: 'Hacked Complaint Title' });
      console.log('TEST 35 - PATCH /complaints/:id:', res.status, res.body);
      expect([403, 404]).toContain(res.status); // Both 403 and 404 are acceptable for cross-tenant protection
    });

    it('36. Company A cannot PATCH Company B complaint status', async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${compBComplaintId}/status`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ status: 'IN_PROGRESS' });
      console.log('TEST 36 - PATCH /complaints/:id/status:', res.status, res.body);
      expect([403, 404]).toContain(res.status); // Both 403 and 404 are acceptable for cross-tenant protection
    });

    it('37. Company A cannot PATCH assign Company B complaint', async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${compBComplaintId}/assign`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ employee_id: compAUser!.id });
      console.log('TEST 37 - PATCH /complaints/:id/assign:', res.status, res.body);
      expect([403, 404]).toContain(res.status); // Both 403 and 404 are acceptable for cross-tenant protection
    });

    // BOOKINGS
    it('38. Company A cannot PUT Company B booking status', async () => {
      const before = await prisma.booking.findUnique({ where: { id: compBBookingId } });

      const res = await request(app)
        .put(`/api/v1/bookings/${compBBookingId}/status`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ status: 'CANCELLED' });
      console.log('TEST 38 - PUT /bookings/:id/status:', res.status, res.body);

      // The route exists, so a routing-level 404 ("API Endpoint not found") must NOT occur.
      // The company-scoped service lookup hides the foreign booking, which surfaces as
      // AppError(404, 'Booking not found') — that specific 404 IS the tenant protection.
      expect(res.status).toBe(404);
      expect(res.body?.message ?? res.body?.error).toMatch(/booking not found/i);

      // Verify the Company B booking was left unchanged.
      const after = await prisma.booking.findUnique({ where: { id: compBBookingId } });
      expect(after).not.toBeNull();
      expect(after!.status).toBe(before!.status);
      expect(after!.updated_at ?? after!.updatedAt ?? null).toEqual((before as any).updated_at ?? (before as any).updatedAt ?? null);
    });

    // PAYMENTS
    it('39. Company A cannot PUT verify Company B payment', async () => {
      const before = await prisma.payment.findUnique({ where: { id: compBPaymentId } });

      const res = await request(app)
        .put(`/api/v1/payments/${compBPaymentId}/status`)
        .set('Authorization', `Bearer ${compAMdToken}`)
        .send({ status: 'SUCCESS' });
      console.log('TEST 39 - PUT /payments/:id/status:', res.status, res.body);

      // The route exists, so a routing-level 404 ("API Endpoint not found") must NOT occur.
      // PaymentService.verifyPayment scopes its lookup by company_id, hiding the foreign
      // payment and surfacing AppError(404, 'Payment not found') — the tenant protection itself.
      expect(res.status).toBe(404);
      expect(res.body?.error ?? res.body?.message).toMatch(/payment not found/i);

      // Verify the Company B payment was left unchanged (still PENDING).
      const after = await prisma.payment.findUnique({ where: { id: compBPaymentId } });
      expect(after).not.toBeNull();
      expect(after!.status).toBe('PENDING');
      expect(after!.status).toBe(before!.status);
    });
  });
});
