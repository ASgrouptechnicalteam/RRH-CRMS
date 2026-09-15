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
  const createRes = await api('POST', '/projects', {
    name: 'Phase17 DM Polish Test',
    location: 'Gachibowli',
    project_type: 'GATED_COMMUNITY',
  });
  const projectId = createRes.json.project?.id;
  console.log('create:', createRes.status, projectId);

  await api('POST', `/projects/${projectId}/submit-for-review`, {});

  const dmListRes = await api('GET', '/employees?role=DIGITAL_MARKETING_EXECUTIVE');
  const dm = (dmListRes.json.employees || [])[0];
  console.log('DM found:', dm?.id, dm?.full_name);

  const polishRes = await api('POST', `/projects/${projectId}/dm-polish`, {
    digital_marketing_executive_id: dm.id,
    seo_title: 'Phase17 DM Polish Test - Gachibowli',
    seo_keywords: 'gated community, gachibowli',
  });
  console.log('dm-polish:', polishRes.status, JSON.stringify(polishRes.json).slice(0, 350));

  const getRes = await api('GET', `/projects/${projectId}`);
  console.log('after polish:', getRes.json.project?.verification_status, getRes.json.project?.digital_marketing_executive_id, getRes.json.project?.seo_title);

  const approveRes = await api('POST', `/projects/${projectId}/md-approve`, { approved: true });
  console.log('md-approve:', approveRes.status);

  const finalRes = await api('GET', `/projects/${projectId}`);
  console.log('final:', finalRes.json.project?.verification_status);
})();
