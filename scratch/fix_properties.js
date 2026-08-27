const fs = require('fs');

// 1. Fix portalWorker.ts
let p = 'apps/api/src/services/portalWorker.ts';
let c = fs.readFileSync(p, 'utf8');
const typeDef = `
type PortalEventPayload = {
  type?: string;
  portal_id?: number;
  max_retries?: number;
  retry_count?: number;
  project_id?: number;
  opportunity_id?: number;
  lead_id?: number;
  message?: string;
  timestamp?: string | Date;
  status?: string;
  portal_mapping_id?: number;
};
`;
c = c.replace("import { PrismaClient } from '@prisma/client';", "import { PrismaClient } from '@prisma/client';\n" + typeDef);
c = c.replace(/event: \{ type\?: string; \[key: string\]: unknown \}/g, 'event: PortalEventPayload');
// fix StartsWith and trim errors on unknown properties
c = c.replace(/payload: Record<string, unknown>/g, 'payload: PortalEventPayload');
c = c.replace(/body: Record<string, unknown>/g, 'body: PortalEventPayload');
fs.writeFileSync(p, c);

// 2. Fix opportunity.workflow.ts
p = 'apps/api/src/workflows/opportunity.workflow.ts';
c = fs.readFileSync(p, 'utf8');
c = c.replace(/(data\.[a-zA-Z0-9_]+)/g, '($1 as unknown as string)');
// The above is too aggressive, let's revert and do specific:
c = fs.readFileSync(p, 'utf8');
c = c.replace(/data\.drop_reason\.trim/g, '(data.drop_reason as string).trim');
c = c.replace(/data\.site_visits\.length/g, '(data.site_visits as unknown[]).length');
c = c.replace(/data\.site_visits\.some/g, '(data.site_visits as unknown[]).some');
c = c.replace(/\(v\) =>/g, '(v: unknown) =>');
fs.writeFileSync(p, c);

// 3. Fix notifyEmployee.ts pushErr unknown
p = 'apps/api/src/utils/notifyEmployee.ts';
c = fs.readFileSync(p, 'utf8');
c = c.replace(/pushErr\./g, '(pushErr as Error).');
fs.writeFileSync(p, c);

// 4. Fix matchingEngine null errors
p = 'apps/api/src/utils/matchingEngine.ts';
c = fs.readFileSync(p, 'utf8');
c = c.replace(/prop\.price/g, '(prop.price as number)');
c = c.replace(/prop\.area_sqft/g, '(prop.area_sqft as number)');
c = c.replace(/prop\.bedrooms/g, '(prop.bedrooms as number)');
c = c.replace(/prop\.facing/g, '(prop.facing as string)');
c = c.replace(/prop\.brand_type/g, '(prop.brand_type as string)');
c = c.replace(/prop\.title/g, '(prop.title as string)');
c = c.replace(/prop\.location/g, '(prop.location as string)');
c = c.replace(/prop\.category/g, '(prop.category as string)');
c = c.replace(/prop\.description/g, '(prop.description as string)');
c = c.replace(/lead\.customer_name/g, '(lead.customer_name as string)');
c = c.replace(/agent\.full_name/g, '(agent.full_name as string)');
c = c.replace(/agent\.phone/g, '(agent.phone as string)');
// fix null assignment to optional undefined
c = c.replace(/budget_min: lead\.budget_min/g, 'budget_min: lead.budget_min ?? undefined');
c = c.replace(/budget_max: lead\.budget_max/g, 'budget_max: lead.budget_max ?? undefined');
c = c.replace(/property_type_preference: lead\.property_type_preference/g, 'property_type_preference: lead.property_type_preference ?? undefined');
fs.writeFileSync(p, c);

console.log('Fixed specific properties.');
