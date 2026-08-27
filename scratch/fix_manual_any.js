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

  // Exact replacements
  const exactReplacements = [
    ['(client as any).', 'client.'],
    ['(tx as any).', 'tx.'],
    ['tx: any', 'tx: Prisma.TransactionClient'],
    ['(leadData: any)', '(leadData: Record<string, unknown>)'],
    ['(rawLeads: any[])', '(rawLeads: Record<string, unknown>[])'],
    ['errors: [] as any[]', 'errors: [] as Record<string, unknown>[]'],
    ['(customer: any, docs: any[])', '(customer: Record<string, unknown>, docs: Record<string, unknown>[])'],
    ['let payload: any;', 'let payload: Record<string, unknown>;'],
    ['let body: any = null;', 'let body: Record<string, unknown> | null = null;'],
    ['let response: { statusCode: number; body: any };', 'let response: { statusCode: number; body: string };'], // Because body is JSON stringified in portalClient usually
    ['(error as any).code', '(error as { code?: string }).code'],
    ['(v: any) =>', '(v: Record<string, unknown>) =>'],
    ['(r: any) =>', '(r: Record<string, unknown>) =>'],
    ['(f: any) =>', '(f: Record<string, unknown>) =>'],
    ['(opp as any)', '(opp as Record<string, unknown>)'],
    ['(lead: any, prop: any, agent: any)', '(lead: Record<string, unknown>, prop: Record<string, unknown>, agent: Record<string, unknown>)'],
    ['const updateData: any = {};', 'const updateData: Record<string, unknown> = {};'],
    ['const safeData: any = {};', 'const safeData: Record<string, unknown> = {};'],
    ['const whereCondition: any =', 'const whereCondition: Record<string, unknown> ='],
    ['const where: any =', 'const where: Record<string, unknown> ='],
    ['const baseWhere: any =', 'const baseWhere: Record<string, unknown> ='],
    ['(event: any, body: Record<string, unknown>)', '(event: Record<string, unknown>, body: Record<string, unknown>)'],
    ['(event: any, attempt: number, error: string)', '(event: Record<string, unknown>, attempt: number, error: string)'],
    ['(event: any, error: string)', '(event: Record<string, unknown>, error: string)'],
    ['(payload: any, idempotencyKey: string)', '(payload: Record<string, unknown>, idempotencyKey: string)'],
    ['dto: any', 'dto: Record<string, unknown>'],
    ['data: any', 'data: Record<string, unknown>'],
    ['(event: any)', '(event: Record<string, unknown>)'],
    ['const response: any =', 'const response: Record<string, unknown> ='],
    ['` as any[]', '` as Record<string, unknown>[]'],
    ['`) as any[]', '`) as Record<string, unknown>[]'],
    ['entity: any;', 'entity: Record<string, unknown>;'],
    ['groups: any[]', 'groups: Record<string, unknown>[]'],
    ['(client as any)', 'client'],
    ['(tx as any)', 'tx'],
    ['(req: any, res: Response)', '(req: Request, res: Response)'],
  ];

  for (const [search, replace] of exactReplacements) {
    // split/join instead of regex for literal string replacement globally
    if (content.includes(search)) {
      const parts = content.split(search);
      content = parts.join(replace);
      totalReplaced += parts.length - 1;
    }
  }

  // Also replace `: any` that are simple
  content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');
  
  if (content !== original) {
    // import Prisma if we added Prisma.TransactionClient
    if (content.includes('Prisma.TransactionClient') && !original.includes('Prisma.TransactionClient') && !content.includes('PrismaClient, Prisma') && !content.includes('Prisma, PrismaClient')) {
      content = content.replace(/import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"];?/, "import { PrismaClient, Prisma } from '@prisma/client';");
    }
    fs.writeFileSync(file, content);
  }
}

console.log('Replaced', totalReplaced, 'exact usages.');
