const fs = require('fs');
const path = require('path');

const replacements = [
  { file: 'apps/api/src/routes/performance.ts', search: 'events: any[]', replace: 'events: Record<string, unknown>[]' },
  { file: 'apps/api/src/routes/public.ts', search: 'properties: any[]', replace: 'properties: Record<string, unknown>[]' },
  { file: 'apps/api/src/routes/targets.ts', search: '=> any[]', replace: '=> Record<string, unknown>[]' },
  { file: 'apps/api/src/routes/targets.ts', search: 'schema: any[]', replace: 'schema: Record<string, unknown>[]' },
  { file: 'apps/api/src/routes/targets.ts', search: 'Record<string, any>', replace: 'Record<string, unknown>' },
  { file: 'apps/api/src/routes/targets.ts', search: 'targets: any[]', replace: 'targets: Record<string, unknown>[]' },
  { file: 'apps/api/src/server.ts', search: 'Record<string, any>', replace: 'Record<string, unknown>' },
  { file: 'apps/api/src/services/ai/searchIntentBridge.ts', search: 'rows: any[]', replace: 'rows: Record<string, unknown>[]' },
  { file: 'apps/api/src/services/ai/searchIntentBridge.ts', search: 'Promise<any[]>', replace: 'Promise<Record<string, unknown>[]>' },
  { file: 'apps/api/src/services/analytics.service.ts', search: 'conversionMetrics: any', replace: 'conversionMetrics: Record<string, unknown>' },
  { file: 'apps/api/src/services/analytics.service.ts', search: 'teamPerformance: any[]', replace: 'teamPerformance: Record<string, unknown>[]' },
  { file: 'apps/api/src/services/analytics.service.ts', search: 'leadAttribution: any[]', replace: 'leadAttribution: Record<string, unknown>[]' },
  { file: 'apps/api/src/services/document-generation.service.ts', search: 'type Browser = any;', replace: 'type Browser = unknown;' },
  { file: 'apps/api/src/services/document.service.ts', search: 'tx: any', replace: 'tx: import("@prisma/client").Prisma.TransactionClient' },
  { file: 'apps/api/src/services/integration.service.ts', search: 'groups: any[]', replace: 'groups: Record<string, unknown>[]' },
  { file: 'apps/api/src/services/integration.service.ts', search: 'Map<string, any>', replace: 'Map<string, unknown>' },
  { file: 'apps/api/src/services/kyc.service.ts', search: 'docs: any[]', replace: 'docs: Record<string, unknown>[]' },
  { file: 'apps/api/src/services/lead.service.ts', search: 'rawLeads: any[]', replace: 'rawLeads: Record<string, unknown>[]' },
  { file: 'apps/api/src/services/notification.service.ts', search: 'Promise<any>', replace: 'Promise<void>' },
  { file: 'apps/api/src/services/portalWorker.ts', search: 'body: any', replace: 'body: Record<string, unknown>' },
  { file: 'apps/api/src/authz/dataScope.ts', search: 'TokenPayload): any', replace: 'TokenPayload): Record<string, unknown>' },
  { file: 'apps/api/src/middleware/authz.ts', search: 'Promise<any>', replace: 'Promise<unknown>' },
  { file: 'apps/api/src/policies/expenseRefund.policy.ts', search: 'TokenPayload): any', replace: 'TokenPayload): Record<string, unknown>' },
  { file: 'apps/api/src/policies/opportunity.policy.ts', search: 'TokenPayload): any', replace: 'TokenPayload): Record<string, unknown>' },
  { file: 'apps/api/src/policies/siteVisit.policy.ts', search: 'TokenPayload): any', replace: 'TokenPayload): Record<string, unknown>' },
];

let changed = 0;
for (const r of replacements) {
  const p = path.join(__dirname, '..', r.file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    const original = content;
    content = content.split(r.search).join(r.replace);
    if (content !== original) {
      fs.writeFileSync(p, content);
      changed++;
    }
  }
}

console.log('Fixed explicitly ' + changed + ' replacements.');
