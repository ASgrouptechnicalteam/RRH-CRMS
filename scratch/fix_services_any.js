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

const files = walk(path.join(__dirname, '../apps/api/src/services'));
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // fix err: any
  content = content.replace(/\(err:\s*any\)/g, '(err: unknown)');
  
  // payload: any, body: any in portalWorker/portalClient
  content = content.replace(/let\s+payload:\s*any;/g, 'let payload: Record<string, unknown> | null = null;');
  content = content.replace(/body:\s*any/g, 'body: Record<string, unknown>');
  content = content.replace(/event:\s*any/g, 'event: Record<string, unknown>');
  content = content.replace(/let\s+response:\s*{\s*statusCode:\s*number;\s*body:\s*any\s*};/g, 'let response: { statusCode: number; body: string };'); // Usually it's a JSON string

  // dto: any -> dto: Record<string, unknown>
  content = content.replace(/dto:\s*any\b/g, 'dto: Record<string, unknown>');
  
  // data: any -> data: Record<string, unknown>
  content = content.replace(/data:\s*any\b/g, 'data: Record<string, unknown>');
  
  // opp as any -> opp as Record<string, unknown>
  content = content.replace(/opp\s+as\s+any\b/g, 'opp as Record<string, unknown>');

  // const where: any = ...
  content = content.replace(/const\s+where:\s*any\s*=/g, 'const where: Record<string, unknown> =');
  content = content.replace(/const\s+whereCondition:\s*any\s*=/g, 'const whereCondition: Record<string, unknown> =');
  content = content.replace(/const\s+baseWhere:\s*any\s*=/g, 'const baseWhere: Record<string, unknown> =');
  
  // let updateData: any = {}
  content = content.replace(/updateData:\s*any/g, 'updateData: Record<string, unknown>');
  content = content.replace(/safeData:\s*any/g, 'safeData: Record<string, unknown>');
  content = content.replace(/bookingData:\s*any/g, 'bookingData: Record<string, unknown>');
  
  // rawLeads: any[]
  content = content.replace(/rawLeads:\s*any\[\]/g, 'rawLeads: Record<string, unknown>[]');
  
  // errors: [] as any[]
  content = content.replace(/errors:\s*\[\]\s*as\s*any\[\]/g, 'errors: [] as Record<string, unknown>[]');
  
  // as any[] (from $queryRaw)
  content = content.replace(/\`\s*\)\s*as\s*any\[\]/g, '`) as Record<string, unknown>[]');
  
  // opportunity: { pipelineMetrics: any; conversionMetrics: any };
  content = content.replace(/opportunity:\s*\{\s*pipelineMetrics:\s*any;\s*conversionMetrics:\s*any\s*\};/g, 'opportunity: { pipelineMetrics: Record<string, unknown>; conversionMetrics: Record<string, unknown> };');
  
  // const res: any = await p.$queryRaw
  content = content.replace(/const\s+res:\s*any\s*=\s*await/g, 'const res: Record<string, unknown>[] = await');
  content = content.replace(/const\s+res:\s*any\s*=/g, 'const res: Record<string, unknown>[] =');

  // reduce acc: any, lead: any
  content = content.replace(/\(acc:\s*any,\s*lead:\s*any\)/g, '(acc: Record<string, number>, lead: Record<string, unknown>)');
  content = content.replace(/\(acc:\s*any,\s*item:\s*any\)/g, '(acc: Record<string, number>, item: Record<string, unknown>)');
  
  // arrays
  content = content.replace(/teamPerformance:\s*any\[\]/g, 'teamPerformance: Record<string, unknown>[]');
  content = content.replace(/leadAttribution:\s*any\[\]/g, 'leadAttribution: Record<string, unknown>[]');

  // r: any
  content = content.replace(/\(r:\s*any\)/g, '(r: Record<string, unknown>)');
  
  // (client as any).
  content = content.replace(/\(client\s*as\s*any\)\./g, 'client.');
  // (tx as any).
  content = content.replace(/\(tx\s*as\s*any\)\./g, 'tx.');
  // (p.property as any).
  content = content.replace(/\(p\.property\s*as\s*any\)\./g, 'p.property.');
  
  // (leadData: any)
  content = content.replace(/leadData:\s*any\b/g, 'leadData: Record<string, unknown>');
  
  // (customer: any, docs: any[])
  content = content.replace(/customer:\s*any,\s*docs:\s*any\[\]/g, 'customer: Record<string, unknown>, docs: Record<string, unknown>[]');
  
  // (error as any).code
  content = content.replace(/\(error\s+as\s+any\)\.code/g, '(error as { code?: string }).code');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log('Fixed services any in', changed, 'files.');
