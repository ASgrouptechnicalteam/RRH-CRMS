const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;

      // resource?: any -> resource?: Record<string, unknown>
      content = content.replace(/resource\?:\s*any/g, 'resource?: Record<string, unknown>');
      
      // authz/dataScope.ts
      content = content.replace(/function getBaseScope\(user:\s*TokenPayload\):\s*any/g, 'function getBaseScope(user: TokenPayload): Record<string, unknown>');
      content = content.replace(/\.includes\(r as any\)/g, '.includes(r as import("@rrh-ems/shared").Roles)');
      
      // policies
      content = content.replace(/static canList\(user:\s*TokenPayload\):\s*any/g, 'static canList(user: TokenPayload): Record<string, unknown> | boolean');
      content = content.replace(/static canListOwn\(user:\s*TokenPayload\):\s*any/g, 'static canListOwn(user: TokenPayload): Record<string, unknown> | boolean');
      content = content.replace(/static canListQueue\(user:\s*TokenPayload\):\s*any/g, 'static canListQueue(user: TokenPayload): Record<string, unknown> | boolean');
      content = content.replace(/let statusFilter:\s*any;/g, 'let statusFilter: Record<string, unknown>;');
      
      content = content.replace(/visit:\s*any\)/g, 'visit: Record<string, unknown>)');
      content = content.replace(/task:\s*any\)/g, 'task: Record<string, unknown>)');

      if (content !== original) {
        fs.writeFileSync(filePath, content);
      }
    }
  }
}

processDir(path.join(__dirname, '../apps/api/src/authz'));
processDir(path.join(__dirname, '../apps/api/src/policies'));
console.log('Fixed authz and policies.');
