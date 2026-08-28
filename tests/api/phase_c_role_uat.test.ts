import request from 'supertest';
import app from '../../apps/api/src/server';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { prisma } from '../../apps/api/src/lib/prisma';
import { Roles } from '@rrh-ems/shared';



describe('Phase C - Role UAT Beta Acceptance', () => {
  const tokens: Record<string, string> = {};
  let baseCompanyId: number;
  let baseLeadId: number;
  let baseCustomerId: number;
  let baseBookingId: number;
  let pmUserId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') throw new Error('Must run in test env');
    await setupDeterministicTestUsers();

    // Authenticate all 12 roles
    for (const [idx, u] of deterministicUsers.entries()) {
      if (u.company_id === 1) {
        const res = await request(app).post('/api/v1/auth/login')
          .set('X-Forwarded-For', `192.168.10.${idx}`)
          .send({
            employee_code: u.employee_code,
            password: 'Password@123',
          });
        if (res.status === 200) {
          tokens[u.roles[0]] = res.body.accessToken;
          baseCompanyId = u.company_id;
        }

        if (u.roles[0] === Roles.PROJECT_MANAGER) {
          const pm = await prisma.employee.findUnique({ where: { employee_code: u.employee_code } });
          if (pm) pmUserId = pm.id;
        }
      }
    }

    const suffix = Date.now().toString().slice(-6);

    const lead = await prisma.lead.create({
      data: {
        lead_code: `LD-PHC-${suffix}`,
        customer_name: 'Phase C Base Lead',
        phone: `+919999${suffix}`,
        company_id: baseCompanyId,
        status: 'NEW'
      }
    });
    baseLeadId = lead.id;

    const customer = await prisma.customer.create({
      data: {
        customer_code: `CST-PHC-${suffix}`,
        first_name: 'Phase C Base Customer',
        phone: `+919998${suffix}`,
        company_id: baseCompanyId,
        origin_lead_id: baseLeadId,
      }
    });
    baseCustomerId = customer.id;

    const property = await prisma.property.create({
      data: {
        property_code: `PRP-PHC-${suffix}`,
        title: 'Phase C Property',
        brand_type: 'RADHA_REAL_HOMES',
        category: 'PLOT',
        price: 10000,
        area_sqft: 1000,
        location: 'Hyderabad',
        company: { connect: { id: baseCompanyId } },
        created_by: { connect: { id: pmUserId } },
        status: 'AVAILABLE'
      }
    });

    const booking = await prisma.booking.create({
      data: {
        booking_code: `BKG-PHC-${suffix}`,
        property: { connect: { id: property.id } },
        company: { connect: { id: baseCompanyId } },
        customer: { connect: { id: baseCustomerId } },
        agreed_price: 10000,
        booking_amount: 10000,
        balance_amount: 0,
        status: 'PENDING'
      }
    });
    baseBookingId = booking.id;
  });

  const getToken = (role: string) => {
    const t = tokens[role];
    if (!t) throw new Error(`Missing token for ${role}`);
    return t;
  };

  // 1. MD - Positive
  it('[MD] EMPLOYEES_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/employees').set('Authorization', `Bearer ${getToken(Roles.MD)}`)
      .send({ full_name: 'MD New Emp', phone: '+919000000001', role_name: Roles.TELECALLER, branch_id: 1 });
    expect(res.status).toBe(201);
  });

  // 2. ADMIN - Positive
  it('[ADMIN] PROJECTS_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${getToken(Roles.ADMIN)}`)
      .send({ name: 'Admin Proj', location: 'HYD', assigned_pm_id: pmUserId });
    expect(res.status).toBe(201);
  });

  // 3. ADMIN - Negative
  it('[ADMIN] LEADS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/leads').set('Authorization', `Bearer ${getToken(Roles.ADMIN)}`)
      .send({ customer_name: 'Admin Lead', phone: '+919000000002' });
    expect(res.status).toBe(403);
  });

  // 4. MARKETING_DIRECTOR - Positive
  it('[MARKETING_DIRECTOR] LEADS_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/leads').set('Authorization', `Bearer ${getToken(Roles.MARKETING_DIRECTOR)}`)
      .send({ customer_name: 'MD Lead', phone: `+9180${Date.now().toString().slice(-6)}03` });
    expect(res.status).toBe(201);
  });

  // 5. MARKETING_DIRECTOR - Negative
  it('[MARKETING_DIRECTOR] PROJECTS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${getToken(Roles.MARKETING_DIRECTOR)}`)
      .send({ name: 'MD Proj', location: 'HYD', assigned_pm_id: pmUserId });
    expect(res.status).toBe(403);
  });

  // 6. PROJECT_MANAGER - Positive
  it('[PROJECT_MANAGER] PROJECTS_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${getToken(Roles.PROJECT_MANAGER)}`)
      .send({ name: 'PM Proj', location: 'HYD', assigned_pm_id: pmUserId });
    expect(res.status).toBe(201);
  });

  // 7. PROJECT_MANAGER - Negative
  it('[PROJECT_MANAGER] PROPERTIES_MD_APPROVE -> 403', async () => {
    const res = await request(app).post('/api/v1/properties/999/md-approve').set('Authorization', `Bearer ${getToken(Roles.PROJECT_MANAGER)}`)
      .send({ notes: 'test' });
    expect(res.status).toBe(403);
  });

  // 8. DIGITAL_LEAD_OPERATOR - Positive
  it('[DIGITAL_LEAD_OPERATOR] LEADS_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/leads').set('Authorization', `Bearer ${getToken(Roles.DIGITAL_LEAD_OPERATOR)}`)
      .send({ customer_name: 'DLO Lead', phone: `+9180${Date.now().toString().slice(-6)}04` });
    expect(res.status).toBe(201);
  });

  // 9. DIGITAL_LEAD_OPERATOR - Negative
  it('[DIGITAL_LEAD_OPERATOR] PROJECTS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${getToken(Roles.DIGITAL_LEAD_OPERATOR)}`)
      .send({ name: 'DLO Proj', location: 'HYD', assigned_pm_id: pmUserId });
    expect(res.status).toBe(403);
  });

  // 10. TELECALLER - Positive
  it('[TELECALLER] LEADS_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/leads').set('Authorization', `Bearer ${getToken(Roles.TELECALLER)}`)
      .send({ customer_name: 'TC Lead', phone: `+9180${Date.now().toString().slice(-6)}05` });
    expect(res.status).toBe(201);
  });

  // 11. TELECALLER - Negative
  it('[TELECALLER] BOOKINGS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${getToken(Roles.TELECALLER)}`)
      .send({ lead_id: baseLeadId, property_id: 1, total_amount: 100, customer_name: 'T', phone: '+919000000000' });
    expect(res.status).toBe(403);
  });

  // 12. DIGITAL_MARKETING_HEAD - Negative
  it('[DIGITAL_MARKETING_HEAD] PROPERTIES_MD_APPROVE -> 403', async () => {
    const res = await request(app).post('/api/v1/properties/999/md-approve').set('Authorization', `Bearer ${getToken(Roles.DIGITAL_MARKETING_HEAD)}`)
      .send({ notes: 'test' });
    expect(res.status).toBe(403);
  });

  // 13. HR_MANAGER - Positive
  it('[HR_MANAGER] EMPLOYEES_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/employees').set('Authorization', `Bearer ${getToken(Roles.HR_MANAGER)}`)
      .send({ full_name: 'HR New Emp', phone: '+919000000006', role_name: Roles.TELECALLER, branch_id: 1 });
    expect(res.status).toBe(201);
  });

  // 14. HR_MANAGER - Negative
  it('[HR_MANAGER] PROJECTS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${getToken(Roles.HR_MANAGER)}`)
      .send({ name: 'HR Proj', location: 'HYD', assigned_pm_id: pmUserId });
    expect(res.status).toBe(403);
  });

  // 15. FINANCE - Positive
  it('[FINANCE] PAYMENTS_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/payments').set('Authorization', `Bearer ${getToken(Roles.FINANCE)}`)
      .send({ 
        booking_id: baseBookingId, 
        amount: 5000, 
        payment_method: 'ONLINE', 
        reference_number: 'TXN123'
      });
    expect(res.status).toBe(201);
  });

  // 16. FINANCE - Negative
  it('[FINANCE] LEADS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/leads').set('Authorization', `Bearer ${getToken(Roles.FINANCE)}`)
      .send({ customer_name: 'Fin Lead', phone: '+919000000007' });
    expect(res.status).toBe(403);
  });

  // 17. AGENT - Positive
  it('[AGENT] COMPLAINTS_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/complaints').set('Authorization', `Bearer ${getToken(Roles.AGENT)}`)
      .send({ customer_id: baseCustomerId, title: 'Test Complaint' });
    expect(res.status).toBe(201);
  });

  // 18. AGENT - Negative
  it('[AGENT] TASKS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${getToken(Roles.AGENT)}`)
      .send({ title: 'Agent Task', priority: 'HIGH', lead_id: baseLeadId });
    expect(res.status).toBe(403);
  });

  // 19. DIGITAL_MARKETING_EXECUTIVE - Positive
  it('[DIGITAL_MARKETING_EXECUTIVE] SITE_VISITS_READ -> 200', async () => {
    // Note: uses legacy requirePermission, verifying it acts as 200 for allowed role
    const res = await request(app).get('/api/v1/site-visits').set('Authorization', `Bearer ${getToken(Roles.DIGITAL_MARKETING_EXECUTIVE)}`);
    expect(res.status).toBe(200);
  });

  // 20. DIGITAL_MARKETING_EXECUTIVE - Negative
  it('[DIGITAL_MARKETING_EXECUTIVE] LEADS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/leads').set('Authorization', `Bearer ${getToken(Roles.DIGITAL_MARKETING_EXECUTIVE)}`)
      .send({ customer_name: 'DME Lead', phone: '+919000000008' });
    expect(res.status).toBe(403);
  });

  // 21. SALES_MANAGER - Positive
  it('[SALES_MANAGER] TASKS_CREATE -> 201', async () => {
    const res = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${getToken(Roles.SALES_MANAGER)}`)
      .send({ title: 'SM Task', priority: 'HIGH', lead_id: baseLeadId, assignee_id: pmUserId, deadline: new Date().toISOString() });
    expect(res.status).toBe(201);
  });

  // 22. SALES_MANAGER - Negative
  it('[SALES_MANAGER] PAYMENTS_CREATE -> 403', async () => {
    const res = await request(app).post('/api/v1/payments').set('Authorization', `Bearer ${getToken(Roles.SALES_MANAGER)}`)
      .send({ 
        amount: 500, 
        reference_id: `REFSM${Date.now()}`, 
        method: 'CASH', 
        booking_id: baseBookingId,
        received_by_id: pmUserId
      });
    expect(res.status).toBe(403);
  });
});
