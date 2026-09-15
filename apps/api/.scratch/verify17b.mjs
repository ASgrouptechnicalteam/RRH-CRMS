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
  const projectId = 9001173;

  // Find a DM Executive employee to assign
  const dmListRes = await api('GET', '/employees?role=DIGITAL_MARKETING_EXECUTIVE');
  const dm = (dmListRes.json.employees || [])[0];
  console.log('DM executive found:', dm?.id, dm?.full_name || dm?.employee_code);

  // DM polish (as MD, who also has PROJECTS_DM_POLISH via broad perms -- check)
  const polishRes = await api('POST', `/projects/${projectId}/dm-polish`, {
    digital_marketing_executive_id: dm?.id,
    seo_title: 'Phase17 Workflow Test - Kompally',
  });
  console.log('DM polish:', polishRes.status, JSON.stringify(polishRes.json).slice(0, 300));

  // MD approve now
  const approveRes = await api('POST', `/projects/${projectId}/md-approve`, { approved: true });
  console.log('MD approve:', approveRes.status, JSON.stringify(approveRes.json).slice(0, 400));

  // Confirm project now visible/VERIFIED
  const getRes = await api('GET', `/projects/${projectId}`);
  console.log('final state:', getRes.json.project?.verification_status, getRes.json.project?.digital_marketing_executive_id, getRes.json.project?.seo_title);
})();
