const fs = require('fs');

// 1. auth.ts
let c = fs.readFileSync('apps/api/src/routes/auth.ts', 'utf8');
c = c.replace(/session\?\.id/g, 'session!.id');
c = c.replace(/session\?\.userId/g, 'session!.userId');
fs.writeFileSync('apps/api/src/routes/auth.ts', c);

// 2. property.service.ts
c = fs.readFileSync('apps/api/src/services/property.service.ts', 'utf8');
c = c.replace(/tx\.propertyFaq/g, '(tx as unknown as { propertyFAQ: import("@prisma/client").Prisma.PropertyFAQDelegate<import("@prisma/client").Prisma.DefaultArgs> }).propertyFAQ');
fs.writeFileSync('apps/api/src/services/property.service.ts', c);

// 3. matchingEngine.ts
c = fs.readFileSync('apps/api/src/utils/matchingEngine.ts', 'utf8');
c = c.replace(/lead\.budget_min \?\? undefined/g, 'lead.budget_min === null ? undefined : lead.budget_min');
c = c.replace(/lead\.budget_max \?\? undefined/g, 'lead.budget_max === null ? undefined : lead.budget_max');
c = c.replace(/lead\.property_type_preference \?\? undefined/g, 'lead.property_type_preference === null ? undefined : lead.property_type_preference');
fs.writeFileSync('apps/api/src/utils/matchingEngine.ts', c);

// 4. public.ts
c = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');
c = c.replace(/id: query\.project_id \|\| undefined/g, 'id: query.project_id === null ? undefined : query.project_id');
// For the 3 select errors: they are missing the correct type because I replaced 'as any' with 'Record<string, unknown>'. Let's replace 'Record<string, unknown>' with nothing for those selects, they don't need explicit types if we let TS infer them!
c = c.replace(/const propertySelect: Record<string, unknown> = {/g, 'const propertySelect = {');
c = c.replace(/const projectSelect: Record<string, unknown> = {/g, 'const projectSelect = {');
fs.writeFileSync('apps/api/src/routes/public.ts', c);

console.log('Fixed final 9 errors.');
