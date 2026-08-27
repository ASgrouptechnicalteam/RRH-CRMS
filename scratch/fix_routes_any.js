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
let totalReplaced = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // routes fixes
  content = content.replace(/req:\s*any,\s*res,\s*next/g, 'req: import("../types").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction');
  
  // Permissions.* as any -> Permissions.*
  content = content.replace(/(Permissions\.[A-Z_]+)\s+as\s+any/g, '$1');

  // whereClause: any
  content = content.replace(/whereClause:\s*any/g, 'whereClause: Record<string, unknown>');

  // parseAndVerifyQR = (req: AuthenticatedRequest, qrPayload: any)
  content = content.replace(/qrPayload:\s*any/g, 'qrPayload: Record<string, unknown>');

  // req.user?.employeeId || (req.user as any)?.userId
  content = content.replace(/\(req\.user as any\)/g, '(req.user as Record<string, unknown>)');

  // Any remaining generic req: any
  content = content.replace(/req:\s*any,\s*res:\s*Response/g, 'req: import("../types").AuthenticatedRequest, res: Response');
  content = content.replace(/\(req:\s*any\)/g, '(req: import("../types").AuthenticatedRequest)');

  // Let's do another pass for other `.ts` files inside routes/
  content = content.replace(/async\s*\(\s*req:\s*any\s*,\s*res\s*,\s*next\s*\)/g, 'async (req: import("../types").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction)');

  // (err: any) -> (err: unknown)
  content = content.replace(/\(err:\s*any\)/g, '(err: unknown)');

  if (content !== original) {
    fs.writeFileSync(file, content);
    totalReplaced++;
  }
}
console.log('Fixed more any. Modified ' + totalReplaced + ' files.');
