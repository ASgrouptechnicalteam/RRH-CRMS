const fs = require('fs');

function replaceExact(file, search, replace) {
    if (!fs.existsSync(file)) return;
    let c = fs.readFileSync(file, 'utf8');
    c = c.split(search).join(replace);
    fs.writeFileSync(file, c);
}

// 1. public.ts
const pub = 'apps/api/src/routes/public.ts';
replaceExact(pub, 'readonly [{ readonly sort_order: "asc" }, { readonly created_at: "asc" }]', "[{ sort_order: 'asc' }, { created_at: 'asc' }]");
replaceExact(pub, "orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] as const", "orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }]");

// 2. tasks.ts
const tasks = 'apps/api/src/routes/tasks.ts';
replaceExact(tasks, "('_isSubordinate' in existingTask ? !!(existingTask as { _isSubordinate?: boolean })._isSubordinate : false) = downstreamIds.includes(existingTask.assignee_id);", "Object.assign(existingTask, { _isSubordinate: downstreamIds.includes(existingTask.assignee_id) });");
replaceExact(tasks, "(existingTask as any)._isSubordinate = downstreamIds.includes(existingTask.assignee_id);", "Object.assign(existingTask, { _isSubordinate: downstreamIds.includes(existingTask.assignee_id) });");

// 3. openRouterProvider.ts
const open = 'apps/api/src/services/ai/openRouterProvider.ts';
replaceExact(open, "Object.keys(b.providers)[0];", "Object.keys(b.providers as object)[0];");
replaceExact(open, "b.usage?.prompt_tokens", "(b.usage as { prompt_tokens?: number })?.prompt_tokens");
replaceExact(open, "b.usage?.completion_tokens", "(b.usage as { completion_tokens?: number })?.completion_tokens");
replaceExact(open, "b.usage?.total_tokens", "(b.usage as { total_tokens?: number })?.total_tokens");

// 4. searchIntentBridge.ts
const bridge = 'apps/api/src/services/ai/searchIntentBridge.ts';
replaceExact(bridge, "c.users", "(c as { users: any }).users"); // wait!
replaceExact(bridge, "(c as { users: unknown }).users", "(c as { users: { get: Function } }).users");

// 5. lead.service.ts
const lSvc = 'apps/api/src/services/lead.service.ts';
replaceExact(lSvc, "errors.push({ row: r.row, reason });", "errors.push({ row: r.row, error: reason });");
replaceExact(lSvc, "errors.push({ row: r.row, reason: ", "errors.push({ row: r.row, error: ");
replaceExact(lSvc, "errors.push({ row: rowNum, error: 'User does not belong to the authenticated company', reason: undefined });", "errors.push({ row: rowNum, error: 'User does not belong to the authenticated company' });");
replaceExact(lSvc, "errors.push({ row: rowNum, error: 'Failed to create lead', reason });", "errors.push({ row: rowNum, error: 'Failed to create lead' });");
