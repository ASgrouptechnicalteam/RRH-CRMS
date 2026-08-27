import request from 'supertest';
import app from '../apps/api/src/app'; // Make sure the path is correct
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runVerification() {
  console.log('=== STARTING RUNTIME WORKFLOW VERIFICATION ===');
  
  // 1. AUTH Workflow
  console.log('\n[1] AUTH WORKFLOW');
  let token = '';
  let employeeId: number;
  let companyId: number;
  
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ employee_code: 'RRH-ADMIN-001', password: 'Password@123' });
    
  if (loginRes.status === 200) {
    console.log('✅ PASS: Login successful for RRH-ADMIN-001');
    token = loginRes.body.token;
    employeeId = loginRes.body.employee.id;
    companyId = loginRes.body.employee.company_id;
  } else {
    console.log(`❌ FAIL: Login failed (${loginRes.status})`, loginRes.body);
    return;
  }
  
  const meRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);
    
  if (meRes.status === 200) {
    console.log('✅ PASS: Authenticated session verified');
  } else {
    console.log(`❌ FAIL: /auth/me failed (${meRes.status})`);
  }
  
  // 2. EMPLOYEES Workflow
  console.log('\n[2] EMPLOYEES WORKFLOW');
  const empList = await request(app).get('/api/v1/employees').set('Authorization', `Bearer ${token}`);
  if (empList.status === 200 && Array.isArray(empList.body.employees)) {
    console.log(`✅ PASS: Listed employees (found ${empList.body.employees.length})`);
  } else {
    console.log(`❌ FAIL: List employees failed`, empList.body);
  }
  
  // Create employee
  const newEmp = await request(app)
    .post('/api/v1/employees')
    .set('Authorization', `Bearer ${token}`)
    .send({
      full_name: 'Verification Employee',
      phone: '9999999991',
      role_name: 'PROJECT_MANAGER',
      branch_id: empList.body.employees[0]?.branchId || 1,
      initial_password: 'Password@123'
    });
    
  if (newEmp.status === 201) {
    console.log('✅ PASS: Created new employee');
  } else {
    console.log('❌ FAIL: Create employee failed', newEmp.body);
  }
  
  // 3. PROJECTS Workflow
  console.log('\n[3] PROJECTS WORKFLOW');
  const projList = await request(app).get('/api/v1/projects').set('Authorization', `Bearer ${token}`);
  if (projList.status === 200) {
    console.log(`✅ PASS: Listed projects (found ${projList.body.projects?.length})`);
  } else {
    console.log('❌ FAIL: List projects failed', projList.body);
  }
  
  // Create Project
  const newProj = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Verification Project',
      code: 'VERIFY-01',
      description: 'Test project',
      project_type: 'APARTMENT',
      status: 'PLANNING',
      total_units: 100,
      total_area: 50000,
      rera_registration_number: 'RERA-123',
      city: 'Hyderabad',
      state: 'TG'
    });
    
  let projectId: number | null = null;
  if (newProj.status === 201) {
    console.log('✅ PASS: Created new project');
    projectId = newProj.body.project.id;
  } else {
    console.log('❌ FAIL: Create project failed', newProj.body);
  }
  
  // 4. PROPERTIES Workflow
  console.log('\n[4] PROPERTIES WORKFLOW');
  const propList = await request(app).get('/api/v1/properties').set('Authorization', `Bearer ${token}`);
  if (propList.status === 200) {
    console.log(`✅ PASS: Listed properties (found ${propList.body.properties?.length || propList.body.data?.length})`);
  } else {
    console.log('❌ FAIL: List properties failed', propList.body);
  }
  
  let propertyId: number | null = null;
  if (projectId) {
    const newProp = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project_id: projectId,
        unit_number: 'V-101',
        type: 'APARTMENT',
        bhk_type: '3BHK',
        area: 1500,
        base_price: 5000000,
        status: 'AVAILABLE'
      });
      
    if (newProp.status === 201) {
      console.log('✅ PASS: Created new property');
      propertyId = newProp.body.property.id;
    } else {
      console.log('❌ FAIL: Create property failed', newProp.body);
    }
  }
  
  // 5. LEADS Workflow
  console.log('\n[5] LEADS WORKFLOW');
  const leadsList = await request(app).get('/api/v1/leads').set('Authorization', `Bearer ${token}`);
  if (leadsList.status === 200) {
    console.log(`✅ PASS: Listed leads`);
  } else {
    console.log('❌ FAIL: List leads failed', leadsList.body);
  }
  
  const newLead = await request(app)
    .post('/api/v1/leads')
    .set('Authorization', `Bearer ${token}`)
    .send({
      customer_name: 'Verify Lead',
      phone: '8888888881',
      source: 'WALKIN',
      status: 'NEW',
      budget: 6000000,
      referral_person_name: 'Referrer Name'
    });
    
  let leadId: number | null = null;
  if (newLead.status === 201) {
    console.log('✅ PASS: Created new lead');
    leadId = newLead.body.lead.id;
  } else {
    console.log('❌ FAIL: Create lead failed', newLead.body);
  }
  
  // 6. CUSTOMERS Workflow
  console.log('\n[6] CUSTOMERS WORKFLOW');
  const custList = await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${token}`);
  if (custList.status === 200) {
    console.log(`✅ PASS: Listed customers`);
  } else {
    console.log('❌ FAIL: List customers failed', custList.body);
  }
  
  const newCust = await request(app)
    .post('/api/v1/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      full_name: 'Verify Customer',
      phone: '7777777771',
      email: 'verify@example.com',
      source: 'WALKIN'
    });
    
  let customerId: number | null = null;
  if (newCust.status === 201) {
    console.log('✅ PASS: Created new customer');
    customerId = newCust.body.customer.id;
  } else {
    console.log('❌ FAIL: Create customer failed', newCust.body);
  }

  // 7. SITE VISITS Workflow
  console.log('\n[7] SITE VISITS WORKFLOW');
  if (leadId && projectId) {
    const newVisit = await request(app)
      .post('/api/v1/site-visits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lead_id: leadId,
        project_id: projectId,
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        status: 'SCHEDULED'
      });
    if (newVisit.status === 201) {
      console.log('✅ PASS: Scheduled site visit');
    } else {
      console.log('❌ FAIL: Schedule site visit failed', newVisit.body);
    }
  } else {
    console.log('⚠️ SKIPPED: Missing lead or project ID');
  }

  // 8. BOOKINGS Workflow
  console.log('\n[8] BOOKINGS WORKFLOW');
  if (customerId && propertyId) {
    const newBooking = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_id: customerId,
        property_id: propertyId,
        booking_amount: 100000,
        payment_method: 'BANK_TRANSFER',
        payment_reference: 'REF-VERIFY',
        notes: 'Verification booking'
      });
    if (newBooking.status === 201) {
      console.log('✅ PASS: Created booking');
    } else {
      console.log('❌ FAIL: Create booking failed', newBooking.body);
    }
  } else {
    console.log('⚠️ SKIPPED: Missing customer or property ID');
  }

  // 9. COMPLAINTS Workflow
  console.log('\n[9] COMPLAINTS WORKFLOW');
  if (customerId) {
    const newComplaint = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_id: customerId,
        subject: 'Verification Complaint',
        description: 'Test complaint',
        category: 'MAINTENANCE',
        priority: 'HIGH'
      });
    if (newComplaint.status === 201) {
      console.log('✅ PASS: Created complaint');
    } else {
      console.log('❌ FAIL: Create complaint failed', newComplaint.body);
    }
  } else {
    console.log('⚠️ SKIPPED: Missing customer ID');
  }

  // 10. NOTIFICATIONS Workflow
  console.log('\n[10] NOTIFICATIONS WORKFLOW');
  const notifList = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`);
  if (notifList.status === 200) {
    console.log(`✅ PASS: Listed notifications (found ${notifList.body.notifications?.length})`);
  } else {
    console.log('❌ FAIL: List notifications failed', notifList.body);
  }

  console.log('\n=== RUNTIME VERIFICATION COMPLETE ===');
  await prisma.$disconnect();
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
