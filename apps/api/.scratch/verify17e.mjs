const BASE = 'http://localhost:3000/api/v1';
const TOKEN = process.env.TOKEN;
async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

(async () => {
  // Create another project as MD, submit for review (leaves it PENDING_DM_POLISH)
  const loginMdRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ employee_code: 'RRH-QA-001', password: 'QaLocal@123' })
  }).then(r => r.json());
  const mdToken = loginMdRes.accessToken;

  const createRes = await fetch(`${BASE}/projects`, {
    method: 'POST', headers: {'Content-Type':'application/json', Authorization: `Bearer ${mdToken}`},
    body: JSON.stringify({ name: 'Phase17 DM Visibility Test', location: 'Miyapur', project_type: 'APARTMENT' })
  }).then(r => r.json());
  const projectId = createRes.project.id;
  await fetch(`${BASE}/projects/${projectId}/submit-for-review`, { method: 'POST', headers: { Authorization: `Bearer ${mdToken}` } });
  console.log('created + submitted:', projectId);

  // Now log in as DM executive
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ employee_code: 'RRH-MK-9999', password: 'DmTest@123' })
  }).then(r => r.json());
  console.log('DM login:', loginRes.message, 'permissions include PROJECTS_DM_POLISH:', loginRes.user?.permissions?.includes('projects.dm_polish'));

  const dmToken = loginRes.accessToken;
  const listRes = await fetch(`${BASE}/projects?limit=200`, { headers: { Authorization: `Bearer ${dmToken}` } }).then(r => r.json());
  const found = (listRes.projects || []).find(p => p.id === projectId);
  console.log('DM can see the PENDING_DM_POLISH project:', !!found, found?.verification_status);

  // Can DM see a DRAFT project (should NOT)?
  const draftCreateRes = await fetch(`${BASE}/projects`, {
    method: 'POST', headers: {'Content-Type':'application/json', Authorization: `Bearer ${mdToken}`},
    body: JSON.stringify({ name: 'Phase17 Draft Should Be Hidden', location: 'X', project_type: 'OTHER' })
  }).then(r => r.json());
  const draftId = draftCreateRes.project.id;
  const listRes2 = await fetch(`${BASE}/projects?limit=200`, { headers: { Authorization: `Bearer ${dmToken}` } }).then(r => r.json());
  const foundDraft = (listRes2.projects || []).find(p => p.id === draftId);
  console.log('DM can see the DRAFT project (should be false):', !!foundDraft);
})();
