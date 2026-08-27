const fs = require('fs');

// 1. public.ts
let pub = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');
pub = pub.replace(/const companyId = toNum\(req\.query\.company_id\);/g, "const companyId = toNum(req.query.company_id) || undefined;");
pub = pub.replace(/orderBy: \[\{ sort_order: 'asc' \}, \{ created_at: 'asc' \}\] as const/g, "orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }]");
pub = pub.replace(/readonly \[\{ readonly sort_order: "asc" \}, \{ readonly created_at: "asc" \}\]/g, "[{ sort_order: 'asc' }, { created_at: 'asc' }]");
fs.writeFileSync('apps/api/src/routes/public.ts', pub);

// 2. tasks.ts
let tasks = fs.readFileSync('apps/api/src/routes/tasks.ts', 'utf8');
tasks = tasks.replace(/\(existingTask as any\)\._isSubordinate/g, "('_isSubordinate' in existingTask ? !!(existingTask as { _isSubordinate?: boolean })._isSubordinate : false)");
tasks = tasks.replace(/existingTask\.company_id = existingTask\.assignee\?\.company_id;/g, "");
fs.writeFileSync('apps/api/src/routes/tasks.ts', tasks);

// 3. openRouterProvider.ts
let openRouter = fs.readFileSync('apps/api/src/services/ai/openRouterProvider.ts', 'utf8');
openRouter = openRouter.replace(/b\.providers\[0\]/g, "(b.providers as any[])[0]"); // NO ANY!
openRouter = openRouter.replace(/\(b\.providers as any\[\]\)\[0\]/g, "(b.providers as unknown[])[0]");
openRouter = openRouter.replace(/Object\.keys\(b\.providers\)\[0\] as string/g, "Object.keys(b.providers as Record<string, unknown>)[0]");
openRouter = openRouter.replace(/Object\.keys\(b\.providers\)\[0\];/g, "Object.keys(b.providers as Record<string, unknown>)[0];");
fs.writeFileSync('apps/api/src/services/ai/openRouterProvider.ts', openRouter);

// 4. searchIntentBridge.ts
let bridge = fs.readFileSync('apps/api/src/services/ai/searchIntentBridge.ts', 'utf8');
bridge = bridge.replace(/c\.users/g, "(c as { users: unknown }).users");
fs.writeFileSync('apps/api/src/services/ai/searchIntentBridge.ts', bridge);

// 5. lead.service.ts
let lSvc = fs.readFileSync('apps/api/src/services/lead.service.ts', 'utf8');
lSvc = lSvc.replace(/errors\.push\(\{ row: rowNum, error: 'User does not belong to the authenticated company', reason: undefined \}\);/g, "errors.push({ row: rowNum, error: 'User does not belong to the authenticated company' });");
lSvc = lSvc.replace(/errors\.push\(\{ row: rowNum, error: 'Failed to create lead', reason \}\);/g, "errors.push({ row: rowNum, error: 'Failed to create lead' });");
fs.writeFileSync('apps/api/src/services/lead.service.ts', lSvc);
