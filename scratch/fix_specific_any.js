const fs = require('fs');
const path = require('path');

const replacements = [
  // middlewares
  { search: '(req as any).authorizedResource = resource;', replace: '(req as import("../types").AuthenticatedRequest).authorizedResource = resource;' },
  { search: '(req as any).requestId = id;', replace: '(req as import("express").Request & { requestId?: string }).requestId = id;' },
  { search: 'skipRateLimitInTests = (req: any) =>', replace: 'skipRateLimitInTests = (req: import("express").Request) =>' },

  // routes
  { search: '].includes(r as any)', replace: '].includes(r as import("@rrh-ems/shared").RoleName)' },
  { search: 'includes(r as any)', replace: 'includes(r as import("@rrh-ems/shared").RoleName)' },
  { search: 'const whereClause: any = {', replace: 'const whereClause: Record<string, unknown> = {' },
  { search: 'const whereCondition: any = {', replace: 'const whereCondition: Record<string, unknown> = {' },
  { search: 'const parseAndVerifyQR = (req: AuthenticatedRequest, qrPayload: any) => {', replace: 'const parseAndVerifyQR = (req: AuthenticatedRequest, qrPayload: Record<string, unknown>) => {' },
  { search: 'const updateData: any = {};', replace: 'const updateData: Record<string, unknown> = {};' },
  { search: 'const safeData: any = {};', replace: 'const safeData: Record<string, unknown> = {};' },
  { search: 'const bookingData: any = {', replace: 'const bookingData: Record<string, unknown> = {' },
  
  // policies
  { search: 'static canMutate(user: TokenPayload, task: any)', replace: 'static canMutate(user: TokenPayload, task: import("@prisma/client").Task)' },
  { search: 'static canMutateSync(user: TokenPayload, task: any)', replace: 'static canMutateSync(user: TokenPayload, task: import("@prisma/client").Task)' },
  { search: 'static canComplete(user: TokenPayload, visit: any)', replace: 'static canComplete(user: TokenPayload, visit: import("@prisma/client").SiteVisit)' },
  { search: 'let statusFilter: any;', replace: 'let statusFilter: Record<string, unknown>;' },

  // matchingEngine
  { search: 'export const generateWhatsAppText = (lead: any, prop: any, agent: any)', replace: 'export const generateWhatsAppText = (lead: Record<string, unknown>, prop: Record<string, unknown>, agent: Record<string, unknown>)' },

  // workflows
  { search: '(error as any).code =', replace: '(error as { code?: string }).code =' },
  { search: 'entity: any;', replace: 'entity: Record<string, unknown>;' },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../apps/api/src'));
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  for (const r of replacements) {
    if (content.includes(r.search)) {
      content = content.split(r.search).join(r.replace);
    }
  }

  // specific hard replacements
  if (file.includes('admin.ts')) {
    content = content.replace(/\(req\.user as any\)\?\.userId/g, 'req.user?.employeeId');
  }

  // specific tx queries
  content = content.replace(/await \(tx as any\)\.([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)/g, 'await (tx as import("@prisma/client").Prisma.TransactionClient).$1.$2');
  content = content.replace(/await \(p\.property as any\)\.([a-zA-Z0-9]+)/g, 'await p.property.$1');

  // specific `as any[]`
  content = content.replace(/as any\[\];/g, 'as Record<string, unknown>[];');

  // specific `catch (error: any)` just in case
  content = content.replace(/catch\s*\((error|err):\s*any\)/g, 'catch ($1: unknown)');

  // specific `(r: any)`
  content = content.replace(/\(r:\s*any\)/g, '(r)');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log('Fixed remaining specific any in ' + changed + ' files.');
