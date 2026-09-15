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

  const asIsRes = await api('POST', `/projects/${projectId}/dm-verify-as-is`, { notes: 'Looks good, no changes needed' });
  console.log('dm-verify-as-is:', asIsRes.status, JSON.stringify(asIsRes.json).slice(0, 300));

  const approveRes = await api('POST', `/projects/${projectId}/md-approve`, { approved: true });
  console.log('md-approve:', approveRes.status, JSON.stringify(approveRes.json).slice(0, 400));

  const getRes = await api('GET', `/projects/${projectId}`);
  console.log('final state:', getRes.json.project?.verification_status);
})();
