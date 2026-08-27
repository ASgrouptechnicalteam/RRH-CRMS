const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../apps/api/src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // fix authz as any
  content = content.replace(/(Permissions\.[A-Z_]+)\s+as\s+any/g, '$1');

  // fix async (req: any, res, next)
  content = content.replace(/async\s*\(\s*req:\s*any\s*,\s*res\s*,\s*next\s*\)/g, 'async (req: import("../types").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction)');

  // fix async (req, res: Response, next) where req was not typed
  // Actually they were mostly typed as `req: any`
  content = content.replace(/req:\s*any\s*,\s*res:\s*Response/g, 'req: import("../types").AuthenticatedRequest, res: Response');
  
  // (req: any)
  content = content.replace(/\(\s*req:\s*any\s*\)/g, '(req: import("../types").AuthenticatedRequest)');
  
  // fix (err: any) -> (err: unknown)
  content = content.replace(/\(err:\s*any\)/g, '(err: unknown)');
  
  // fix (req.user as any)?.userId -> req.user?.userId (wait, TokenPayload doesn't have userId, it has employeeId!)
  content = content.replace(/\(req\.user as any\)\?\.userId/g, 'req.user?.employeeId');

  // Any remaining generic req: any
  content = content.replace(/req:\s*any/g, 'req: import("../types").AuthenticatedRequest');

  // res: any -> res: import("express").Response
  content = content.replace(/res:\s*any/g, 'res: import("express").Response');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}
console.log('Fixed routes any.');
