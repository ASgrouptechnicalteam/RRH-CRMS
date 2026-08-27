const fs = require('fs');

function replaceAll(f, search, replace) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(f, content);
}

// 1. DataScope / Policies (includes r as any)
function fixIncludes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/MANAGEMENT_ROLES\.includes\((r|role_name) as any\)/g, "(MANAGEMENT_ROLES as string[]).includes($1)");
  content = content.replace(/KYC_AUTHORIZED_ROLES\.includes\((r|role_name) as any\)/g, "(KYC_AUTHORIZED_ROLES as string[]).includes($1)");
  content = content.replace(/\[Roles\.MD, Roles\.HR_MANAGER\]\.includes\((r|role_name) as any\)/g, "([Roles.MD, Roles.HR_MANAGER] as string[]).includes($1)");
  content = content.replace(/\[Roles\.MD, Roles\.ADMIN\]\.includes\((r|role_name) as any\)/g, "([Roles.MD, Roles.ADMIN] as string[]).includes($1)");
  content = content.replace(/\[Roles\.MD, Roles\.HR_MANAGER, Roles\.ADMIN, Roles\.MARKETING_DIRECTOR\]\.includes\((r|role_name) as any\)/g, "([Roles.MD, Roles.HR_MANAGER, Roles.ADMIN, Roles.MARKETING_DIRECTOR] as string[]).includes($1)");
  content = content.replace(/\[Roles\.MD, Roles\.ADMIN, Roles\.HR_MANAGER, Roles\.MARKETING_DIRECTOR\]\.includes\((r|role_name) as any\)/g, "([Roles.MD, Roles.ADMIN, Roles.HR_MANAGER, Roles.MARKETING_DIRECTOR] as string[]).includes($1)");
  content = content.replace(/\[\s*Roles\.MD,\s*Roles\.HR_MANAGER,\s*Roles\.SALES_MANAGER,\s*Roles\.BRANCH_MANAGER,\s*Roles\.MARKETING_DIRECTOR\s*\]\.includes\((r|role_name) as any\)/g, "([Roles.MD, Roles.HR_MANAGER, Roles.SALES_MANAGER, Roles.BRANCH_MANAGER, Roles.MARKETING_DIRECTOR] as string[]).includes($1)");
  content = content.replace(/\[\s*Roles\.MD,\s*Roles\.HR_MANAGER,\s*Roles\.FRONT_DESK,\s*Roles\.BRANCH_MANAGER\s*\]\.includes\((r|role_name) as any\)/g, "([Roles.MD, Roles.HR_MANAGER, Roles.FRONT_DESK, Roles.BRANCH_MANAGER] as string[]).includes($1)");
  content = content.replace(/\[\s*Roles\.MD,\s*Roles\.HR_MANAGER,\s*Roles\.ADMIN,\s*Roles\.MARKETING_DIRECTOR\s*\]\.includes\((r|role_name) as any\)/g, "([Roles.MD, Roles.HR_MANAGER, Roles.ADMIN, Roles.MARKETING_DIRECTOR] as string[]).includes($1)");
  // Catch any remaining
  content = content.replace(/\.includes\((r|role_name) as any\)/g, " as string[]).includes($1)"); 
  fs.writeFileSync(filePath, content);
}

[
  'apps/api/src/authz/dataScope.ts',
  'apps/api/src/policies/booking.policy.ts',
  'apps/api/src/policies/customer.policy.ts',
  'apps/api/src/policies/document.policy.ts',
  'apps/api/src/policies/kyc.policy.ts',
  'apps/api/src/policies/lead.policy.ts',
  'apps/api/src/policies/opportunity.policy.ts',
  'apps/api/src/policies/payment.policy.ts',
  'apps/api/src/policies/project.policy.ts',
  'apps/api/src/policies/property.policy.ts',
  'apps/api/src/policies/siteVisit.policy.ts',
  'apps/api/src/policies/task.policy.ts',
  'apps/api/src/routes/admin.ts',
  'apps/api/src/routes/employees.ts',
  'apps/api/src/routes/targets.ts'
].forEach(f => fixIncludes(f));

replaceAll('apps/api/src/routes/admin.ts', "req.user!.roles.includes(Roles.ADMIN as any)", "req.user!.roles.includes(Roles.ADMIN)"); 
replaceAll('apps/api/src/routes/employees.ts', "userRoles.includes(Roles.ADMIN as any)", "userRoles.includes(Roles.ADMIN)");
replaceAll('apps/api/src/routes/employees.ts', "userRoles.includes(Roles.MD as any)", "userRoles.includes(Roles.MD)");

// 2. Middleware / Requests
replaceAll('apps/api/src/middleware/authz.ts', "(req as any).authorizedResource = resource;", "req.authorizedResource = resource;");
let authTs = fs.readFileSync('apps/api/src/middleware/auth.ts', 'utf8');
authTs = authTs.replace("user?: TokenPayload;", "user?: TokenPayload;\n  authorizedResource?: string;\n  requestId?: string;");
fs.writeFileSync('apps/api/src/middleware/auth.ts', authTs);

let corr = fs.readFileSync('apps/api/src/middleware/correlationId.ts', 'utf8');
if (!corr.includes('AuthenticatedRequest')) {
  corr = "import { AuthenticatedRequest } from './auth';\n" + corr;
}
corr = corr.replace(/\(req as any\)/g, "(req as AuthenticatedRequest)");
fs.writeFileSync('apps/api/src/middleware/correlationId.ts', corr);

let pub = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');
if (!pub.includes('export interface PublicRequest')) {
  pub = `export interface PublicRequest extends import('express').Request { apiKeyContext?: any; }\n` + pub;
}
pub = pub.replace(/\(req as any\)\.apiKeyContext/g, "(req as PublicRequest).apiKeyContext");
fs.writeFileSync('apps/api/src/routes/public.ts', pub);

// 3. Permissions.X as any
function fixRequireAuthz(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/requireAuthz\((Permissions\.[A-Z_]+) as any\)/g, "requireAuthz($1)");
  fs.writeFileSync(filePath, content);
}
[
  'apps/api/src/routes/booking.routes.ts',
  'apps/api/src/routes/complaint.routes.ts',
  'apps/api/src/routes/installment.routes.ts',
  'apps/api/src/routes/payment.routes.ts',
].forEach(f => fixRequireAuthz(f));

// 4. (req.user as any)?.userId -> req.user?.employeeId
function fixUserPayload(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\(req\.user as any\)\?\.userId/g, "req.user?.employeeId");
  content = content.replace(/\(req\.user as any\)\?\.id/g, "req.user?.employeeId");
  content = content.replace(/\(req\.user as any\)\?\.company_id/g, "req.user?.companyId");
  fs.writeFileSync(filePath, content);
}
['apps/api/src/routes/admin.ts', 'apps/api/src/routes/md.ts', 'apps/api/src/routes/integration.routes.ts'].forEach(f => fixUserPayload(f));

// 5. delete (emp as any).panNumber; -> Just set to undefined instead of deleting. 
// "The operand of a 'delete' operator must be optional."
let empTs = fs.readFileSync('apps/api/src/routes/employees.ts', 'utf8');
empTs = empTs.replace(/delete \(emp as any\)\.([a-zA-Z]+);/g, "/* deleted $1 */");
// Wait, setting to undefined works: `(emp as any).$1 = undefined;` but I want no ANY.
// `(emp as Partial<typeof emp>).$1 = undefined;` is valid.
empTs = empTs.replace(/\/\* deleted ([a-zA-Z]+) \*\//g, "(emp as Partial<typeof emp>).$1 = undefined;");
fs.writeFileSync('apps/api/src/routes/employees.ts', empTs);

// 6. (error as any).code
let leads = fs.readFileSync('apps/api/src/routes/leads.ts', 'utf8');
leads = leads.replace(/\(error as any\)\.code/g, "(error as { code?: string }).code");
fs.writeFileSync('apps/api/src/routes/leads.ts', leads);

let leadWf = fs.readFileSync('apps/api/src/workflows/lead.workflow.ts', 'utf8');
leadWf = leadWf.replace(/\(error as any\)\.code = 'INVALID_STATE_TRANSITION';/g, "(error as Error & { code?: string }).code = 'INVALID_STATE_TRANSITION';");
fs.writeFileSync('apps/api/src/workflows/lead.workflow.ts', leadWf);

// 7. tasks.ts authzContext
let tasks = fs.readFileSync('apps/api/src/routes/tasks.ts', 'utf8');
tasks = tasks.replace(/authzContext as any/g, "authzContext");
fs.writeFileSync('apps/api/src/routes/tasks.ts', tasks);

// 8. openRouterProvider.ts
let openRouter = fs.readFileSync('apps/api/src/services/ai/openRouterProvider.ts', 'utf8');
openRouter = openRouter.replace(/const b = body as any;/g, "const b = body as Record<string, unknown>;");
// fix property accesses
openRouter = openRouter.replace(/b\.error\?\.message/g, "(b.error as any)?.message"); // wait! I said no any.
openRouter = openRouter.replace(/\(b\.error as any\)\?\.message/g, "(b.error as { message?: string })?.message");
openRouter = openRouter.replace(/b\.usage\?\.prompt_tokens/g, "(b.usage as { prompt_tokens?: number })?.prompt_tokens");
openRouter = openRouter.replace(/b\.usage\?\.completion_tokens/g, "(b.usage as { completion_tokens?: number })?.completion_tokens");
openRouter = openRouter.replace(/b\.usage\?\.total_tokens/g, "(b.usage as { total_tokens?: number })?.total_tokens");
fs.writeFileSync('apps/api/src/services/ai/openRouterProvider.ts', openRouter);

// 9. searchIntentBridge.ts
let bridge = fs.readFileSync('apps/api/src/services/ai/searchIntentBridge.ts', 'utf8');
bridge = bridge.replace(/const c = client as any;/g, "const c = client as unknown;");
bridge = bridge.replace(/c\.users/g, "(c as { users: unknown }).users");
fs.writeFileSync('apps/api/src/services/ai/searchIntentBridge.ts', bridge);

// 10. booking.service.ts
let bSvc = fs.readFileSync('apps/api/src/services/booking.service.ts', 'utf8');
bSvc = bSvc.replace(/`\) as any\[\];/g, "`) as unknown[];");
// property accesses on `unknown[]` will fail. Let's cast to `Record<string, unknown>[]`
bSvc = bSvc.replace(/`\) as unknown\[\];/g, "`) as Record<string, unknown>[];");
fs.writeFileSync('apps/api/src/services/booking.service.ts', bSvc);

// 11. lead.service.ts
let lSvc = fs.readFileSync('apps/api/src/services/lead.service.ts', 'utf8');
lSvc = lSvc.replace(/errors: \[\] as any\[\]/g, "errors: [] as { row: number, error: string, reason?: string }[]");
fs.writeFileSync('apps/api/src/services/lead.service.ts', lSvc);

// 12. opportunity.service.ts
let oSvc = fs.readFileSync('apps/api/src/services/opportunity.service.ts', 'utf8');
oSvc = oSvc.replace(/opp as any/g, "opp as unknown as import('@prisma/client').Opportunity");
fs.writeFileSync('apps/api/src/services/opportunity.service.ts', oSvc);

