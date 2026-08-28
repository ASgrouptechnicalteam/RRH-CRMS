async function verifyWorkflows() {
  const API_URL = 'http://localhost:3000/api/v1';
  let token = '';
  
  const log = (msg) => console.log(`[VERIFY] ${msg}`);
  const pass = (msg) => console.log(`[PASS] ${msg}`);
  const fail = (msg) => console.error(`[FAIL] ${msg}`);

  try {
    // 1. AUTH - Login
    log('Attempting login with RRH-ADMIN-001...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_code: 'RRH-ADMIN-001', password: 'Radhareal@123' })
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    const loginData = await loginRes.json();
    const adminToken = loginData.accessToken || loginData.token;
    pass('Login successful. Token acquired.');

    // 1B. AUTH - Login Sales Manager
    log('Attempting login with DEV-SM-001...');
    const smLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_code: 'DEV-SM-001', password: 'Radhareal@123' })
    });
    if (!smLoginRes.ok) throw new Error(`SM Login failed: ${smLoginRes.status} ${await smLoginRes.text()}`);
    const smToken = (await smLoginRes.json()).accessToken;
    pass('SM Login successful.');

    const adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
    const smHeaders = { 'Authorization': `Bearer ${smToken}`, 'Content-Type': 'application/json' };

    // 2. EMPLOYEES
    log('Fetching employees...');
    const empRes = await fetch(`${API_URL}/employees`, { headers: adminHeaders });
    if (!empRes.ok) throw new Error(`Employees fetch failed: ${empRes.status} ${await empRes.text()}`);
    pass(`Employees fetched successfully. Found ${(await empRes.json()).length} employees.`);

    // 3. PROJECTS
    log('Fetching projects...');
    const projRes = await fetch(`${API_URL}/projects`, { headers: adminHeaders });
    if (!projRes.ok) throw new Error(`Projects fetch failed: ${projRes.status} ${await projRes.text()}`);
    pass(`Projects fetched successfully. Found ${(await projRes.json()).projects?.length || 0} projects.`);

    // 4. PROPERTIES
    log('Fetching properties...');
    const propRes = await fetch(`${API_URL}/properties`, { headers: adminHeaders });
    if (!propRes.ok) throw new Error(`Properties fetch failed: ${propRes.status} ${await propRes.text()}`);
    pass(`Properties fetched successfully. Found ${(await propRes.json()).properties?.length || 0} properties.`);

    // 5. LEADS
    log('Fetching leads...');
    const leadsRes = await fetch(`${API_URL}/leads`, { headers: smHeaders });
    if (!leadsRes.ok) throw new Error(`Leads fetch failed: ${leadsRes.status} ${await leadsRes.text()}`);
    pass(`Leads fetched successfully. Found ${(await leadsRes.json()).leads?.length || 0} leads.`);

    // 6. CUSTOMERS
    log('Fetching customers...');
    const custRes = await fetch(`${API_URL}/customers`, { headers: smHeaders });
    if (!custRes.ok) throw new Error(`Customers fetch failed: ${custRes.status} ${await custRes.text()}`);
    pass(`Customers fetched successfully. Found ${(await custRes.json()).customers?.length || 0} customers.`);

    // 7. SITE VISITS
    log('Fetching site visits...');
    const siteVisitsRes = await fetch(`${API_URL}/site-visits`, { headers: smHeaders });
    if (!siteVisitsRes.ok) throw new Error(`Site visits fetch failed: ${siteVisitsRes.status} ${await siteVisitsRes.text()}`);
    pass(`Site visits fetched successfully. Found ${(await siteVisitsRes.json()).site_visits?.length || 0} site visits.`);

    // 8. BOOKINGS
    log('Fetching bookings...');
    const bookingsRes = await fetch(`${API_URL}/bookings`, { headers: smHeaders });
    if (!bookingsRes.ok) throw new Error(`Bookings fetch failed: ${bookingsRes.status} ${await bookingsRes.text()}`);
    pass(`Bookings fetched successfully. Found ${(await bookingsRes.json()).bookings?.length || 0} bookings.`);

    log('All existing workflows endpoints verified successfully.');
    
  } catch (error) {
    fail(error.message);
    process.exit(1);
  }
}

verifyWorkflows();
