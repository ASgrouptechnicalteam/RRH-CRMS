const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;

      // (req as any).authorizedResource
      content = content.replace(/\(req\s*as\s*any\)\.authorizedResource/g, '((req as unknown) as { authorizedResource?: Record<string, unknown> }).authorizedResource');
      // (req as any).requestId
      content = content.replace(/\(req\s*as\s*any\)\.requestId/g, '((req as unknown) as { requestId?: string }).requestId');
      
      // utils/matchingEngine.ts
      content = content.replace(/\(lead:\s*any,\s*prop:\s*any,\s*agent:\s*any\)/g, '(lead: Record<string, unknown>, prop: Record<string, unknown>, agent: Record<string, unknown>)');
      
      // utils/distributionService.ts
      content = content.replace(/\(sum:\s*number,\s*r:\s*any\)/g, '(sum: number, r: Record<string, unknown>)');
      content = content.replace(/r\.call_count/g, '(r.call_count as number)');
      
      // workflows/types.ts
      content = content.replace(/entity:\s*any;/g, 'entity: Record<string, unknown>;');
      
      // workflows/opportunity.workflow.ts
      content = content.replace(/\(v:\s*any\)/g, '(v: Record<string, unknown>)');
      content = content.replace(/\(error\s*as\s*any\)\.code/g, '(error as { code?: string }).code');
      
      // ai/
      content = content.replace(/prop:\s*any/g, 'prop: Record<string, unknown>');
      content = content.replace(/rows:\s*any\[\]/g, 'rows: Record<string, unknown>[]');
      content = content.replace(/client\s*as\s*any/g, 'client as Record<string, unknown>');
      content = content.replace(/body\s*as\s*any/g, 'body as Record<string, unknown>');

      if (content !== original) {
        fs.writeFileSync(filePath, content);
      }
    }
  }
}

processDir(path.join(__dirname, '../apps/api/src/middleware'));
processDir(path.join(__dirname, '../apps/api/src/utils'));
processDir(path.join(__dirname, '../apps/api/src/workflows'));
processDir(path.join(__dirname, '../apps/api/src/services/ai'));
console.log('Fixed middleware, utils, workflows, ai.');
