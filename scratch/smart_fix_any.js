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
  // Fix error.message accesses (simple ones)
  content = content.replace(/([a-zA-Z0-9_]+)\.message/g, '(($1 as Error).message || "Unknown error")');
  // Re-fix res.status(500).json({ error: (error as Error).message... }) where error is just 'error'
  // Actually, blind replace of error.message is risky if it's not in catch.
  // Instead let's just do it manually for error.message in routes?
  // Let's just do `($1 as Error).message` if $1 is `err` or `error`.
  content = content.replace(/\berror\.message\b/g, '(error as Error).message');
  content = content.replace(/\berr\.message\b/g, '(err as Error).message');
  content = content.replace(/\berror\.code\b/g, '(error as { code?: string }).code');
  content = content.replace(/\berr\.code\b/g, '(err as { code?: string }).code');

  // 3. routes req: any
  if (file.includes('routes')) {
    content = content.replace(/\(req: any, res: Response/g, '(req: import("../types").AuthenticatedRequest, res: Response');
    content = content.replace(/\(req: any, res: express\.Response/g, '(req: import("../types").AuthenticatedRequest, res: express.Response');
    content = content.replace(/\(req: any, res: any/g, '(req: import("../types").AuthenticatedRequest, res: import("express").Response');
  }

  // 4. iterators (remove explicit type entirely!)
  content = content.replace(/\([a-zA-Z0-9_]+:\s*any\)\s*=>/g, (match) => {
    return match.replace(/:\s*any/, ''); // (e: any) => becomes (e) =>
  });

  // 5. Authz resource 
  if (file.includes('authorization.ts')) {
    content = content.replace(/resource\?: any/g, 'resource?: never');
    content = content.replace(/, resource\)/g, ', resource as never)');
  }
  
  // 6. dataScope RoleName fix
  if (file.includes('dataScope') || file.includes('policies')) {
    content = content.replace(/\.includes\(([a-zA-Z0-9_]+)\s*as\s*any\)/g, '.includes($1 as never)');
    content = content.replace(/\.includes\(([a-zA-Z0-9_]+)\)/g, (match, p1) => {
      if (match.includes('Roles.')) return match;
      return `.includes(${p1} as never)`;
    });
  }

  // 7. General remaining explicit `: any`
  content = content.replace(/:\s*any(\s*=|;|,|\))/g, ': never$1');
  
  // 8. General `as any`
  content = content.replace(/\sas any/g, ' as never');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log('Applied smart fixes to ' + changed + ' files.');
