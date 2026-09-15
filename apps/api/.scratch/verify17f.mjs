const BASE = 'http://localhost:3000/api/v1';
async function api(token, method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

(async () => {
  const mdLogin = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ employee_code: 'RRH-QA-001', password: 'QaLocal@123' }) }).then(r=>r.json());
  const mdToken = mdLogin.accessToken;

  const create = await api(mdToken, 'POST', '/projects', { name: 'Phase17 Post-Assign Visibility', location: 'Test Location', project_type: 'OTHER' });
  const projectId = create.json.project.id;
  await api(mdToken, 'POST', `/projects/${projectId}/submit-for-review`, {});
  const polish = await api(mdToken, 'POST', `/projects/${projectId}/dm-polish`, { digital_marketing_executive_id: 8884345 });
  console.log('after dm-polish, state:', polish.json.project?.verification_status);

  const dmLogin = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ employee_code: 'RRH-MK-9999', password: 'DmTest@123' }) }).then(r=>r.json());
  const dmToken = dmLogin.accessToken;

  const getRes = await api(dmToken, 'GET', `/projects/${projectId}`);
  console.log('DM can see own-assigned PENDING_MD_APPROVAL project:', getRes.status, getRes.json.project?.verification_status || getRes.json.error);
})();
