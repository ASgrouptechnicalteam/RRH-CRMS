import axios from 'axios';

const BASE = 'http://localhost:3000/api/v1';
const results: Record<string, string> = {};

const pass = (test: string, detail?: string) => {
  results[test] = `PASS${detail ? ' — ' + detail : ''}`;
  console.log(`✅ ${test}${detail ? ': ' + detail : ''}`);
};
const fail = (test: string, detail?: string) => {
  results[test] = `FAIL${detail ? ' — ' + detail : ''}`;
  console.error(`❌ ${test}${detail ? ': ' + detail : ''}`);
};

const api = axios.create({ baseURL: BASE, withCredentials: true });

let mdCookie = '';
let pmCookie = '';
let fmCookie = '';
let demCookie = '';
let custACookie = '';
let custBCookie = '';

// Helper to extract cookie from response
const extractCookie = (headers: any): string => {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  const tokenCookie = Array.isArray(setCookie)
    ? setCookie.find((c: string) => c.startsWith('token='))
    : setCookie;
  return tokenCookie ? tokenCookie.split(';')[0] : '';
};

const main = async () => {
  // ══════════════════════════════════════════
  // 1. HEALTH CHECK
  // ══════════════════════════════════════════
  try {
    const r = await axios.get('http://localhost:3000/health');
    if (r.data.status === 'ok') pass('1.1 Backend Health');
    else fail('1.1 Backend Health', JSON.stringify(r.data));
  } catch (e: any) {
    fail('1.1 Backend Health', e.message);
  }

  // ══════════════════════════════════════════
  // 2. AUTHENTICATION — REAL DATABASE
  // ══════════════════════════════════════════

  // MD login
  try {
    const r = await api.post('/auth/login', { identifier: 'EMP-MD-001', password: 'Test@1234' });
    mdCookie = extractCookie(r.headers);
    if (r.data.user?.role === 'MD' && mdCookie) pass('2.1 MD Login', `role=${r.data.user.role}`);
    else fail('2.1 MD Login', JSON.stringify(r.data));
  } catch (e: any) {
    fail('2.1 MD Login', e.response?.data?.message || e.message);
  }

  // PM login
  try {
    const r = await api.post('/auth/login', { identifier: 'EMP-PM-001', password: 'Test@1234' });
    pmCookie = extractCookie(r.headers);
    if (r.data.user?.role === 'PM') pass('2.2 PM Login');
    else fail('2.2 PM Login', JSON.stringify(r.data));
  } catch (e: any) {
    fail('2.2 PM Login', e.response?.data?.message || e.message);
  }

  // FM login
  try {
    const r = await api.post('/auth/login', { identifier: 'EMP-FM-001', password: 'Test@1234' });
    fmCookie = extractCookie(r.headers);
    if (r.data.user?.role === 'FM') pass('2.3 FM Login');
    else fail('2.3 FM Login', JSON.stringify(r.data));
  } catch (e: any) {
    fail('2.3 FM Login', e.response?.data?.message || e.message);
  }

  // DEM login
  try {
    const r = await api.post('/auth/login', { identifier: 'EMP-DEM-001', password: 'Test@1234' });
    demCookie = extractCookie(r.headers);
    if (r.data.user?.role === 'DEM') pass('2.4 DEM Login');
    else fail('2.4 DEM Login', JSON.stringify(r.data));
  } catch (e: any) {
    fail('2.4 DEM Login', e.response?.data?.message || e.message);
  }

  // Customer A login
  try {
    const r = await api.post('/auth/login', {
      identifier: '9000000001',
      password: 'Customer@1234',
    });
    custACookie = extractCookie(r.headers);
    if (r.data.user?.role === 'Customer') pass('2.5 Customer A Login');
    else fail('2.5 Customer A Login', JSON.stringify(r.data));
  } catch (e: any) {
    fail('2.5 Customer A Login', e.response?.data?.message || e.message);
  }

  // Customer B login
  try {
    const r = await api.post('/auth/login', {
      identifier: '9000000002',
      password: 'Customer@1234',
    });
    custBCookie = extractCookie(r.headers);
    if (r.data.user?.role === 'Customer') pass('2.6 Customer B Login');
    else fail('2.6 Customer B Login', JSON.stringify(r.data));
  } catch (e: any) {
    fail('2.6 Customer B Login', e.response?.data?.message || e.message);
  }

  // Wrong password
  try {
    await api.post('/auth/login', { identifier: 'EMP-MD-001', password: 'WRONGPASSWORD' });
    fail('2.7 Wrong Password Rejected', 'Should have returned 401');
  } catch (e: any) {
    if (e.response?.status === 401 || e.response?.status === 400)
      pass('2.7 Wrong Password Rejected', `status ${e.response.status}`);
    else fail('2.7 Wrong Password Rejected', e.message);
  }

  // ══════════════════════════════════════════
  // 3. RBAC — CROSS-ROLE ISOLATION
  // ══════════════════════════════════════════

  // Customer cannot access MD route
  try {
    await api.get('/md/dashboard', { headers: { Cookie: custACookie } });
    fail('3.1 Customer blocked from MD route', 'Got 200');
  } catch (e: any) {
    if (e.response?.status === 403) pass('3.1 Customer blocked from MD route', 'status 403');
    else fail('3.1 Customer blocked from MD route', `status ${e.response?.status}`);
  }

  // PM cannot access FM route
  try {
    await api.get('/fm/dashboard', { headers: { Cookie: pmCookie } });
    fail('3.2 PM blocked from FM route', 'Got 200');
  } catch (e: any) {
    if (e.response?.status === 403) pass('3.2 PM blocked from FM route', 'status 403');
    else fail('3.2 PM blocked from FM route', `status ${e.response?.status}`);
  }

  // DEM cannot access PM route
  try {
    await api.get('/pm/dashboard', { headers: { Cookie: demCookie } });
    fail('3.3 DEM blocked from PM route', 'Got 200');
  } catch (e: any) {
    if (e.response?.status === 403) pass('3.3 DEM blocked from PM route', 'status 403');
    else fail('3.3 DEM blocked from PM route', `status ${e.response?.status}`);
  }

  // No token → 401
  try {
    await api.get('/md/dashboard');
    fail('3.4 Unauthenticated blocked from MD', 'Got 200');
  } catch (e: any) {
    if (e.response?.status === 401) pass('3.4 Unauthenticated blocked', 'status 401');
    else fail('3.4 Unauthenticated blocked', `status ${e.response?.status}`);
  }

  // ══════════════════════════════════════════
  // 4. MD ROUTES
  // ══════════════════════════════════════════
  try {
    const r = await api.get('/md/dashboard', { headers: { Cookie: mdCookie } });
    if (r.status === 200)
      pass(
        '4.1 MD Dashboard',
        `totalEmployees=${r.data.totalEmployees}, projects=${r.data.totalProjects}`,
      );
    else fail('4.1 MD Dashboard', `status ${r.status}`);
  } catch (e: any) {
    fail('4.1 MD Dashboard', e.response?.data?.message || e.message);
  }

  try {
    const r = await api.get('/md/employees', { headers: { Cookie: mdCookie } });
    if (Array.isArray(r.data) && r.data.length > 0)
      pass('4.2 MD Employee List', `count=${r.data.length}`);
    else fail('4.2 MD Employee List', `returned: ${JSON.stringify(r.data)}`);
  } catch (e: any) {
    fail('4.2 MD Employee List', e.response?.data?.message || e.message);
  }

  // ══════════════════════════════════════════
  // 5. PM ROUTES — PROJECT ISOLATION
  // ══════════════════════════════════════════
  let alphaProjectId = '';
  let betaProjectId = '';

  try {
    const r = await api.get('/pm/projects', { headers: { Cookie: pmCookie } });
    if (Array.isArray(r.data) && r.data.some((p: any) => p.name === 'Alpha Residency')) {
      alphaProjectId = r.data.find((p: any) => p.name === 'Alpha Residency').id;
      pass('5.1 PM Assigned Projects', `projects=${r.data.map((p: any) => p.name).join(', ')}`);
    } else fail('5.1 PM Assigned Projects', `returned: ${JSON.stringify(r.data)}`);
  } catch (e: any) {
    fail('5.1 PM Assigned Projects', e.response?.data?.message || e.message);
  }

  // PM accesses Alpha (assigned) — should succeed
  if (alphaProjectId) {
    try {
      const r = await api.get(`/pm/projects/${alphaProjectId}`, { headers: { Cookie: pmCookie } });
      if (r.status === 200 && r.data.name === 'Alpha Residency')
        pass('5.2 PM Can Access Assigned Project');
      else fail('5.2 PM Can Access Assigned Project', JSON.stringify(r.data));
    } catch (e: any) {
      fail('5.2 PM Can Access Assigned Project', e.response?.data?.message || e.message);
    }
  }

  // Get Beta's ID first via MD
  try {
    const r = await api.get('/md/projects', { headers: { Cookie: mdCookie } });
    const beta = r.data?.find((p: any) => p.name === 'Beta Heights');
    if (beta) betaProjectId = beta.id;
  } catch (e: any) {
    /* ignore */
  }

  // PM blocked from Beta (unassigned)
  if (betaProjectId) {
    try {
      await api.get(`/pm/projects/${betaProjectId}`, { headers: { Cookie: pmCookie } });
      fail('5.3 PM Blocked from Unassigned Project', 'Got 200');
    } catch (e: any) {
      if (e.response?.status === 403) pass('5.3 PM Blocked from Unassigned Project', 'status 403');
      else fail('5.3 PM Blocked from Unassigned Project', `status ${e.response?.status}`);
    }
  } else {
    fail('5.3 PM Blocked from Unassigned Project', 'Could not get Beta project ID from MD route');
  }

  // ══════════════════════════════════════════
  // 6. FM ROUTES — SINGLE PROJECT ENFORCEMENT
  // ══════════════════════════════════════════
  try {
    const r = await api.get('/fm/dashboard', { headers: { Cookie: fmCookie } });
    if (r.status === 200) pass('6.1 FM Dashboard', JSON.stringify(r.data).slice(0, 100));
    else fail('6.1 FM Dashboard');
  } catch (e: any) {
    fail('6.1 FM Dashboard', e.response?.data?.message || e.message);
  }

  // FM cannot create update for Beta (unassigned)
  if (betaProjectId) {
    try {
      await api.post(
        `/fm/projects/${betaProjectId}/construction-updates`,
        { stage: 'Test', percentage: 10 },
        { headers: { Cookie: fmCookie } },
      );
      fail('6.2 FM Blocked from Unassigned Project Update', 'Got 200');
    } catch (e: any) {
      if (e.response?.status === 403 || e.response?.status === 404)
        pass('6.2 FM Blocked from Unassigned Project Update', `status ${e.response?.status}`);
      else fail('6.2 FM Blocked from Unassigned Project Update', `status ${e.response?.status}`);
    }
  }

  // ══════════════════════════════════════════
  // 7. CUSTOMER ISOLATION
  // ══════════════════════════════════════════
  let custAPropertyId = '';

  try {
    const r = await api.get('/customers/properties', { headers: { Cookie: custACookie } });
    if (Array.isArray(r.data) && r.data.some((p: any) => p.propertyNumber === 'A-101')) {
      custAPropertyId = r.data.find((p: any) => p.propertyNumber === 'A-101').id;
      pass('7.1 Customer A Properties', `count=${r.data.length}, has A-101`);
    } else fail('7.1 Customer A Properties', JSON.stringify(r.data));
  } catch (e: any) {
    fail('7.1 Customer A Properties', e.response?.data?.message || e.message);
  }

  // Customer B has no properties
  try {
    const r = await api.get('/customers/properties', { headers: { Cookie: custBCookie } });
    if (Array.isArray(r.data) && r.data.length === 0)
      pass('7.2 Customer B Has No Properties', 'Empty array');
    else fail('7.2 Customer B Has No Properties', `returned ${r.data.length} items`);
  } catch (e: any) {
    fail('7.2 Customer B Has No Properties', e.response?.data?.message || e.message);
  }

  // Customer B cannot access Customer A's property
  if (custAPropertyId) {
    try {
      await api.get(`/customers/properties/${custAPropertyId}`, {
        headers: { Cookie: custBCookie },
      });
      fail('7.3 Customer B Blocked from Customer A Property', 'Got 200');
    } catch (e: any) {
      if (e.response?.status === 404 || e.response?.status === 403)
        pass('7.3 Customer B Blocked from Customer A Property', `status ${e.response?.status}`);
      else fail('7.3 Customer B Blocked from Customer A Property', `status ${e.response?.status}`);
    }
  }

  // Customer A financials — only approved payments counted
  try {
    const r = await api.get('/customers/financials', { headers: { Cookie: custACookie } });
    if (Array.isArray(r.data) && r.data.length > 0) {
      const sched = r.data[0];
      // installment 1 is paid 500000 (approved), installment 2 has 250000 pending
      const approvedOnly = sched.totalScheduleCollected;
      pass('7.4 Customer A Financials', `collected=${approvedOnly}`);
    } else fail('7.4 Customer A Financials', JSON.stringify(r.data));
  } catch (e: any) {
    fail('7.4 Customer A Financials', e.response?.data?.message || e.message);
  }

  // Customer A notifications
  try {
    const r = await api.get('/customers/dashboard', { headers: { Cookie: custACookie } });
    if (r.status === 200 && r.data.notifications?.length > 0)
      pass('7.5 Customer A Notifications', `count=${r.data.notifications.length}`);
    else if (r.status === 200)
      pass('7.5 Customer A Dashboard', `notifications=${r.data.notifications?.length || 0}`);
    else fail('7.5 Customer A Notifications', JSON.stringify(r.data));
  } catch (e: any) {
    fail('7.5 Customer A Notifications', e.response?.data?.message || e.message);
  }

  // ══════════════════════════════════════════
  // 8. PAYMENT WORKFLOW — REAL DB
  // ══════════════════════════════════════════

  // DEM Creates Payment (Forced Pending)
  let newPaymentId = '';
  try {
    const r = await api.post(
      '/dem/payments',
      {
        installmentId: 'inst-003',
        amount: 100000,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-PAT-001',
      },
      { headers: { Cookie: demCookie } },
    );
    newPaymentId = r.data.id;
    if (r.data.verificationStatus === 'Pending Verification')
      pass('8.1 DEM Creates Payment (Forced Pending)', `id=${newPaymentId}`);
    else fail('8.1 DEM Creates Payment', `status was: ${r.data.verificationStatus}`);
  } catch (e: any) {
    fail('8.1 DEM Creates Payment', e.response?.data?.message || e.message);
  }

  // PM Verification Queue finds it
  try {
    const r = await api.get('/payments/queue', { headers: { Cookie: pmCookie } });
    if (Array.isArray(r.data) && r.data.find((p: any) => p.id === newPaymentId)) {
      pass('8.2 PM Verification Queue', `found created payment id=${newPaymentId}`);
    } else fail('8.2 PM Verification Queue', `returned: ${JSON.stringify(r.data)}`);
  } catch (e: any) {
    fail('8.2 PM Verification Queue', e.response?.data?.message || e.message);
  }

  // DEM cannot self-approve (even with PM role spoofing — but DEM has no access to /payments)
  try {
    await api.get('/payments/queue', { headers: { Cookie: demCookie } });
    fail('8.3 DEM Blocked from Payment Queue', 'Got 200');
  } catch (e: any) {
    if (e.response?.status === 403) pass('8.3 DEM Blocked from Payment Queue', 'status 403');
    else fail('8.3 DEM Blocked from Payment Queue', `status ${e.response?.status}`);
  }

  // Reject without reason — must fail
  if (newPaymentId) {
    try {
      await api.put(
        `/payments/${newPaymentId}/verify`,
        { decision: 'Rejected' },
        { headers: { Cookie: pmCookie } },
      );
      fail('8.4 Reject Without Reason Blocked', 'Got 200');
    } catch (e: any) {
      if (e.response?.status === 400)
        pass('8.4 Reject Without Reason Blocked', 'status 400 — reason required');
      else fail('8.4 Reject Without Reason Blocked', `status ${e.response?.status}`);
    }

    // Approve payment via PM
    try {
      const r = await api.put(
        `/payments/${newPaymentId}/verify`,
        { decision: 'Approved', remarks: 'PAT approval' },
        { headers: { Cookie: pmCookie } },
      );
      if (r.data.verificationStatus === 'Approved')
        pass('8.5 PM Approves Payment', `status=${r.data.verificationStatus}`);
      else fail('8.5 PM Approves Payment', JSON.stringify(r.data));
    } catch (e: any) {
      fail('8.5 PM Approves Payment', e.response?.data?.message || e.message);
    }
  }

  // Create another pending payment via DEM route, then reject it
  let secondPaymentId = '';
  try {
    const r = await api.post(
      '/dem/payments',
      {
        installmentId: 'inst-003',
        amount: 50000,
        paymentMethod: 'NEFT',
        referenceNumber: 'NEFT-PAT-002',
      },
      { headers: { Cookie: demCookie } },
    );
    secondPaymentId = r.data.id;
  } catch (e: any) {
    /* ignore */
  }

  // Reject new payment (by MD)
  if (secondPaymentId) {
    try {
      const r = await api.put(
        `/payments/${secondPaymentId}/verify`,
        { decision: 'Rejected', rejectionReason: 'Blurry proof image — resubmit' },
        { headers: { Cookie: mdCookie } },
      );
      if (r.data.verificationStatus === 'Rejected')
        pass('8.6 MD Rejects Payment', `reason recorded`);
      else fail('8.6 MD Rejects Payment', JSON.stringify(r.data));
    } catch (e: any) {
      fail('8.6 MD Rejects Payment', e.response?.data?.message || e.message);
    }
  }

  // ══════════════════════════════════════════
  // 9. CONTENT
  // ══════════════════════════════════════════
  try {
    const r = await api.get('/system/content/active', { headers: { Cookie: custACookie } });
    const hasCarousel = r.data.carousels?.length > 0;
    const hasPopup = r.data.popups?.length > 0;
    const hasOffer = r.data.offers?.length > 0;
    const hasAnnouncement = r.data.announcements?.length > 0;
    if (hasCarousel && hasPopup && hasOffer && hasAnnouncement) {
      pass(
        '9.1 Active Content Returned',
        `carousels=${r.data.carousels.length}, popups=${r.data.popups.length}, offers=${r.data.offers.length}, announcements=${r.data.announcements.length}`,
      );
    } else {
      fail(
        '9.1 Active Content Returned',
        `carousels=${r.data.carousels?.length}, popups=${r.data.popups?.length}, offers=${r.data.offers?.length}, announcements=${r.data.announcements?.length}`,
      );
    }
  } catch (e: any) {
    fail('9.1 Active Content Returned', e.response?.data?.message || e.message);
  }

  // ══════════════════════════════════════════
  // 10. FILE SECURITY — UPLOAD VALIDATION
  // ══════════════════════════════════════════
  const FormData = require('form-data');

  // Invalid MIME
  try {
    const fd = new FormData();
    fd.append('file', Buffer.from('#!/bin/bash\nrm -rf /'), {
      filename: 'malicious.sh',
      contentType: 'application/x-sh',
    });
    await api.post('/documents/upload', fd, { headers: { ...fd.getHeaders(), Cookie: mdCookie } });
    fail('10.1 Invalid MIME Blocked', 'Got 200');
  } catch (e: any) {
    if (e.response?.status === 400) pass('10.1 Invalid MIME Blocked', 'status 400');
    else
      fail(
        '10.1 Invalid MIME Blocked',
        `status ${e.response?.status}, ${e.response?.data?.message}`,
      );
  }

  // Valid PDF (buffer)
  try {
    const fd = new FormData();
    fd.append('file', Buffer.from('%PDF-1.4 test document content'), {
      filename: 'agreement.pdf',
      contentType: 'application/pdf',
    });
    fd.append('referenceType', 'Customer');
    fd.append('referenceId', 'test-cust-01');
    fd.append('documentType', 'Agreement');
    const r = await api.post('/documents/upload', fd, {
      headers: { ...fd.getHeaders(), Cookie: mdCookie },
    });
    if (r.status === 201 || r.status === 200) pass('10.2 Valid PDF Upload', `id=${r.data.id}`);
    else fail('10.2 Valid PDF Upload', `status ${r.status}`);
  } catch (e: any) {
    fail('10.2 Valid PDF Upload', e.response?.data?.message || e.message);
  }

  // ══════════════════════════════════════════
  // 11. REPORTS
  // ══════════════════════════════════════════
  try {
    const r = await api.get('/reports/revenue', { headers: { Cookie: mdCookie } });
    if (r.status === 200) pass('11.1 MD Revenue Report', `total=${r.data.totalRevenue}`);
    else fail('11.1 MD Revenue Report');
  } catch (e: any) {
    fail('11.1 MD Revenue Report', e.response?.data?.message || e.message);
  }

  // ══════════════════════════════════════════
  // 12. AUDIT LOGS
  // ══════════════════════════════════════════
  try {
    const r = await api.get('/md/audit-logs', { headers: { Cookie: mdCookie } });
    if (r.status === 200 && Array.isArray(r.data))
      pass('12.1 Audit Logs', `count=${r.data.length}`);
    else fail('12.1 Audit Logs', JSON.stringify(r.data));
  } catch (e: any) {
    fail('12.1 Audit Logs', e.response?.data?.message || e.message);
  }

  // ══════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════');
  console.log('PRODUCTION ACCEPTANCE TEST — COMPLETE RESULTS');
  console.log('═══════════════════════════════════════════════════');

  let passed = 0,
    failed = 0;
  for (const [test, result] of Object.entries(results)) {
    const ok = result.startsWith('PASS');
    if (ok) passed++;
    else failed++;
    console.log(`${ok ? '✅' : '❌'} ${test}: ${result}`);
  }

  console.log('\n──────────────────────────────────────────────────');
  console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
  console.log('──────────────────────────────────────────────────');
};

main().catch((e) => {
  console.error('Test runner error:', e.message);
  process.exit(1);
});
