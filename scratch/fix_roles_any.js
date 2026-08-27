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

  // roles.some((r) => [...].includes(r as any))
  content = content.replace(/\.includes\(r as any\)/g, '.includes(r as import("@rrh-ems/shared").Roles)');
  content = content.replace(/\.includes\(r as unknown as Roles\)/g, '.includes(r as import("@rrh-ems/shared").Roles)');
  content = content.replace(/\.includes\(([^ ]+) as any\)/g, '.includes($1 as import("@rrh-ems/shared").Roles)');
  
  // resource?: any -> resource?: Record<string, unknown>
  content = content.replace(/resource\?:\s*any/g, 'resource?: Record<string, unknown>');
  
  // : any for function return types where it returns a filter object
  content = content.replace(/function getBaseScope\([^)]+\):\s*any\s*\{/g, (m) => m.replace(': any', ': Record<string, unknown>'));
  content = content.replace(/static canList\([^)]+\):\s*any\s*\{/g, (m) => m.replace(': any', ': Record<string, unknown> | boolean'));
  content = content.replace(/static canListOwn\([^)]+\):\s*any\s*\{/g, (m) => m.replace(': any', ': Record<string, unknown> | boolean'));
  content = content.replace(/static canListQueue\([^)]+\):\s*any\s*\{/g, (m) => m.replace(': any', ': Record<string, unknown> | boolean'));

  // statusFilter: any;
  content = content.replace(/let\s+statusFilter:\s*any;/g, 'let statusFilter: Record<string, unknown>;');
  
  // (req as any).authorizedResource = resource;
  content = content.replace(/\(req as any\)\.authorizedResource/g, '((req as unknown) as { authorizedResource?: Record<string, unknown> }).authorizedResource');
  content = content.replace(/\(req as any\)\.requestId/g, '((req as unknown) as { requestId?: string }).requestId');
  
  // static canComplete(user: TokenPayload, visit: any)
  content = content.replace(/visit:\s*any\)/g, 'visit: Record<string, unknown>)');
  
  // static async canMutate(user: TokenPayload, task: any)
  content = content.replace(/task:\s*any\)/g, 'task: Record<string, unknown>)');

  // filter(opp => OpportunityPolicy.canView(user, opp as any))
  // We already replaced opp as any -> opp as Record<string, unknown> in the previous script?
  // Let's replace any leftover generic stuff
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    totalReplaced++;
  }
}

console.log('Fixed policies and roles usages. Files modified:', totalReplaced);
