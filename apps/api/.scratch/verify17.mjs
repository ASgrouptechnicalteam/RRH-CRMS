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
  // 1. Create a project (as MD, so it starts as DRAFT)
  const createRes = await api('POST', '/projects', {
    name: 'Phase17 Workflow Test',
    location: 'Kompally',
    project_type: 'TOWNSHIP',
  });
  const projectId = createRes.json.project?.id;
  console.log('1. create:', createRes.status, projectId, createRes.json.project?.verification_status);

  // 2. Submit for review (DRAFT -> PENDING_DM_POLISH)
  const submitRes = await api('POST', `/projects/${projectId}/submit-for-review`, {});
  console.log('2. submit-for-review:', submitRes.status, submitRes.json.project?.verification_status);

  // 3. Try MD-approve prematurely -- should fail (not pending MD approval yet)
  const prematureRes = await api('POST', `/projects/${projectId}/md-approve`, { approved: true });
  console.log('3. premature md-approve (should 400):', prematureRes.status, prematureRes.json.error);

  console.log(JSON.stringify({ projectId }));
})();
