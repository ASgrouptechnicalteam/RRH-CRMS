async function runVerification() {
  console.log('=== STARTING HTTP RUNTIME WORKFLOW VERIFICATION ===');
  const baseUrl = 'http://localhost:5000/api/v1';
  
  // 1. AUTH Workflow
  console.log('\n[1] AUTH WORKFLOW');
  let token = '';
  
  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_code: 'RRH-ADMIN-001', password: 'Radhareal@123' })
    });
    const loginData = await loginRes.json();
      
    if (loginRes.status === 200) {
      console.log('✅ PASS: Login successful for RRH-ADMIN-001');
      console.log('Admin Permissions:', loginData.user.permissions);
      token = loginData.accessToken;
    } else {
      console.log(`❌ FAIL: Login failed (${loginRes.status})`, loginData);
      return;
    }
    
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
      
    if (meRes.status === 200) {
      console.log('✅ PASS: Authenticated session verified');
    } else {
      console.log(`❌ FAIL: /auth/me failed (${meRes.status})`, meData);
    }
    
    // 2. EMPLOYEES Workflow
    console.log('\n[2] EMPLOYEES WORKFLOW');
    const empList = await fetch(`${baseUrl}/employees`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const empData = await empList.json();
    if (empList.status === 200 && Array.isArray(empData.employees)) {
      console.log(`✅ PASS: Listed employees (found ${empData.employees.length})`);
    } else {
      console.log(`❌ FAIL: List employees failed`, empData);
    }
    
    // Create employee
    const newEmp = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        first_name: 'Verification',
        last_name: 'Employee',
        full_name: 'Verification Employee',
        phone: '9999999992',
        role_name: 'project managers',
        branch_id: empData.employees[0]?.branchId || 1,
        initial_password: 'Radhareal@123'
      })
    });
    const newEmpData = await newEmp.json();
      
    if (newEmp.status === 201) {
      console.log('✅ PASS: Created new employee');
    } else {
      console.log('❌ FAIL: Create employee failed', newEmpData);
    }
    
    // 3. PROJECTS Workflow
    console.log('\n[3] PROJECTS WORKFLOW');
    const projList = await fetch(`${baseUrl}/projects`, { headers: { 'Authorization': `Bearer ${token}` } });
    const projData = await projList.json();
    if (projList.status === 200) {
      console.log(`✅ PASS: Listed projects (found ${projData.projects?.length})`);
    } else {
      console.log('❌ FAIL: List projects failed', projData);
    }
    
    // Create Project
    const newProj = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Verification Project ' + Date.now(),
        code: 'VERIFY-' + Math.floor(Math.random()*1000),
        description: 'Test project',
        project_type: 'APARTMENT',
        status: 'PLANNING',
        total_units: 100,
        total_area: "50000",
        location: 'Hyderabad',
        rera_registration_number: 'RERA-123',
        city: 'Hyderabad',
        state: 'TG'
      })
    });
    const newProjData = await newProj.json();
      
    let projectId = null;
    if (newProj.status === 201) {
      console.log('✅ PASS: Created new project');
      projectId = newProjData.project.id;
    } else {
      console.log('❌ FAIL: Create project failed', newProjData);
    }
    
    // 4. PROPERTIES Workflow
    console.log('\n[4] PROPERTIES WORKFLOW');
    const propList = await fetch(`${baseUrl}/properties`, { headers: { 'Authorization': `Bearer ${token}` } });
    const propData = await propList.json();
    if (propList.status === 200) {
      console.log(`✅ PASS: Listed properties (found ${propData.properties?.length || propData.data?.length})`);
    } else {
      console.log('❌ FAIL: List properties failed', propData);
    }
    
    let propertyId = null;
    if (projectId) {
      const newProp = await fetch(`${baseUrl}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          project_id: projectId,
          title: 'Verification Property',
          brand_type: 'RADHA_REAL_HOMES',
          category: 'APARTMENT',
          price: 5000000,
          area_sqft: 1500,
          location: 'Hyderabad',
          unit_number: 'V-102',
          type: 'APARTMENT',
          bhk_type: '3BHK',
          status: 'LIVE'
        })
      });
      const newPropData = await newProp.json();
        
      if (newProp.status === 201) {
        console.log('✅ PASS: Created new property');
        propertyId = newPropData.property.id;
        
        // Admin verifies property to make it LIVE for booking
        // Step 1: Verify
        const verifyProp = await fetch(`${baseUrl}/properties/${propertyId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ approved: true, notes: 'Verified by Admin for verification script' })
        });
        
        // Step 2: DM Polish
        const dmPolishProp = await fetch(`${baseUrl}/properties/${propertyId}/dm-polish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ seo_title: 'Title', seo_keywords: 'keywords', description: 'Desc', notes: 'Polished' })
        });

        // Step 3: MD Approve (Go Live)
        const mdApproveProp = await fetch(`${baseUrl}/properties/${propertyId}/md-approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ approved: true, comments: 'Approved' })
        });

        if (mdApproveProp.status === 200) {
          console.log('✅ PASS: Verified property to LIVE status');
        } else {
          console.log('❌ FAIL: Verify property failed', await mdApproveProp.json());
        }
      } else {
        console.log('❌ FAIL: Create property failed', newPropData);
      }
    }
    
    // 5. LEADS Workflow
    console.log('\n[5] LEADS WORKFLOW');
    const leadsList = await fetch(`${baseUrl}/leads`, { headers: { 'Authorization': `Bearer ${token}` } });
    const leadsData = await leadsList.json();
    if (leadsList.status === 200) {
      console.log(`✅ PASS: Listed leads`);
    } else {
      console.log('❌ FAIL: List leads failed', leadsData);
    }
    
    const newLead = await fetch(`${baseUrl}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customer_name: 'Verify Lead ' + Date.now(),
        phone: '888' + String(Date.now()).slice(-7),
        source: 'WALKIN',
        status: 'NEW',
        budget: 6000000,
        referral_person_name: 'Referrer Name'
      })
    });
    const newLeadData = await newLead.json();
      
    let leadId = null;
    if (newLead.status === 201) {
      console.log('✅ PASS: Created new lead');
      leadId = newLeadData.lead.id;
    } else {
      console.log('❌ FAIL: Create lead failed', newLeadData);
    }
    
    // 6. CUSTOMERS Workflow
    console.log('\n[6] CUSTOMERS WORKFLOW');
    const custList = await fetch(`${baseUrl}/customers`, { headers: { 'Authorization': `Bearer ${token}` } });
    const custData = await custList.json();
    if (custList.status === 200) {
      console.log(`✅ PASS: Listed customers`);
    } else {
      console.log('❌ FAIL: List customers failed', custData);
    }
    
    const newCust = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        first_name: 'Verify',
        last_name: 'Customer',
        phone: '777' + Math.floor(Math.random()*10000000),
        email: `verify${Date.now()}@example.com`,
        source: 'WALKIN'
      })
    });
    const newCustData = await newCust.json();
      
    let customerId = null;
    if (newCust.status === 201) {
      console.log('✅ PASS: Created new customer');
      customerId = newCustData.customer?.id || newCustData.id;
    } else {
      console.log('❌ FAIL: Create customer failed', newCustData);
    }
  
    // 7. SITE VISITS Workflow
    console.log('\n[7] SITE VISITS WORKFLOW');
    if (leadId && propertyId) {
      const newVisit = await fetch(`${baseUrl}/site-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          lead_id: leadId,
          property_id: propertyId,
          scheduled_date: new Date(Date.now() + 86400000).toISOString(),
          pick_up_requested: false
        })
      });
      const newVisitData = await newVisit.json();
      if (newVisit.status === 201) {
        console.log('✅ PASS: Scheduled site visit');
      } else {
        console.log('❌ FAIL: Schedule site visit failed', newVisitData);
      }
    } else {
      console.log('⚠️ SKIPPED: Missing lead or project ID');
    }
  
    // 8. BOOKINGS Workflow
    console.log('\n[8] BOOKINGS WORKFLOW');
    if (customerId && propertyId) {
      const newBooking = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          customer_id: customerId,
          property_id: propertyId,
          agreed_price: 5000000,
          booking_amount: 100000,
          notes: 'Verification booking'
        })
      });
      const newBookingData = await newBooking.json();
      if (newBooking.status === 201) {
        console.log('✅ PASS: Created booking');
      } else {
        console.log('❌ FAIL: Create booking failed', newBookingData);
      }
    } else {
      console.log('⚠️ SKIPPED: Missing customer or property ID');
    }
  
    // 9. COMPLAINTS Workflow
    console.log('\n[9] COMPLAINTS WORKFLOW');
    if (customerId) {
      const newComplaint = await fetch(`${baseUrl}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          customer_id: customerId,
          title: 'Verification Complaint',
          description: 'A test complaint',
          priority: 'HIGH'
        })
      });
      const newComplaintData = await newComplaint.json();
      if (newComplaint.status === 201) {
        console.log('✅ PASS: Created complaint');
      } else {
        console.log('❌ FAIL: Create complaint failed', newComplaintData);
      }
    } else {
      console.log('⚠️ SKIPPED: Missing customer ID');
    }
  
    // 10. NOTIFICATIONS Workflow
    console.log('\n[10] NOTIFICATIONS WORKFLOW');
    const notifList = await fetch(`${baseUrl}/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });
    const notifData = await notifList.json();
    if (notifList.status === 200) {
      console.log(`✅ PASS: Listed notifications (found ${notifData.notifications?.length})`);
    } else {
      console.log('❌ FAIL: List notifications failed', notifData);
    }
  
    console.log('\n=== RUNTIME VERIFICATION COMPLETE ===');
  } catch (err) {
    console.error('Network Error:', err);
  }
}

runVerification();
