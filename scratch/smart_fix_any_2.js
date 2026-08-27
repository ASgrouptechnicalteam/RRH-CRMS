const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
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

  // 1. Prisma fix
  content = content.replace(/const p = prisma as any;/g, 'const p = prisma;');
  content = content.replace(/\(tx: any\)/g, '(tx: import("@prisma/client").Prisma.TransactionClient)');
  
  // 2. catch (error: any)
  content = content.replace(/catch\s*\(([^:]+):\s*any\)/g, 'catch ($1: unknown)');

  // 3. routes req: any
  if (file.includes('routes') || file.includes('middleware')) {
    content = content.replace(/\(req: any, res: Response/g, '(req: import("../types").AuthenticatedRequest, res: Response');
    content = content.replace(/\(req: any, res: express\.Response/g, '(req: import("../types").AuthenticatedRequest, res: express.Response');
    content = content.replace(/\(req: any, res: any/g, '(req: import("../types").AuthenticatedRequest, res: import("express").Response');
  }

  // 4. iterators (remove explicit type entirely!)
  content = content.replace(/\([a-zA-Z0-9_]+:\s*any\)\s*=>/g, (match) => {
    return match.replace(/:\s*any/, ''); // (e: any) => becomes (e) =>
  });
  
  // 5. dataScope RoleName fix
  content = content.replace(/\.includes\(([a-zA-Z0-9_]+)\s*as\s*any\)/g, '.includes($1 as import("@rrh-ems/shared").RoleName)');

  // 6. Explicitly safe explicit fixes for 'any[]'
  if (file.includes('performance.ts')) content = content.replace(/events: any\[\]/, 'events: Record<string, unknown>[]');
  if (file.includes('public.ts')) content = content.replace(/properties: any\[\]/, 'properties: Record<string, unknown>[]');
  if (file.includes('searchIntentBridge.ts')) {
    content = content.replace(/rows: any\[\]/g, 'rows: Record<string, unknown>[]');
    content = content.replace(/Promise<any\[\]>/g, 'Promise<Record<string, unknown>[]>');
  }
  if (file.includes('integration.service.ts')) {
    content = content.replace(/groups: any\[\]/g, 'groups: Record<string, unknown>[]');
  }
  if (file.includes('kyc.service.ts')) content = content.replace(/docs: any\[\]/g, 'docs: Record<string, unknown>[]');
  if (file.includes('lead.service.ts')) content = content.replace(/rawLeads: any\[\]/g, 'rawLeads: Record<string, unknown>[]');
  
  // 7. Explicit fix for portalWorker
  if (file.includes('portalWorker.ts')) {
    content = content.replace(/body: any/g, 'body: Record<string, unknown>');
    content = content.replace(/payload: any/g, 'payload: Record<string, unknown>');
    content = content.replace(/event: any/g, 'event: { type?: string; [key: string]: unknown }');
  }
  
  // 8. Authz middleware
  if (file.includes('middleware\\\\authz.ts') || file.includes('middleware/authz.ts')) {
    content = content.replace(/Promise<any>/, 'Promise<unknown>');
    content = content.replace(/\(req as any\)/, '(req as import("../types").AuthenticatedRequest)');
  }
  if (file.includes('correlationId.ts')) content = content.replace(/\(req as any\)/, '(req as import("express").Request & { requestId?: string })');
  if (file.includes('rateLimiter.ts')) content = content.replace(/\(req: any\)/, '(req: import("express").Request)');
  
  // 9. authorization.ts
  if (file.includes('authorization.ts')) {
    content = content.replace(/resource\?: any/, 'resource?: Record<string, unknown>');
    content = content.replace(/resource\.company_id/, '(resource as { company_id?: number }).company_id');
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log('Applied smart fixes 2.0 to ' + changed + ' files.');
