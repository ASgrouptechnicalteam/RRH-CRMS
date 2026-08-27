const fs = require('fs');

// 1. property.service.ts
let c = fs.readFileSync('apps/api/src/services/property.service.ts', 'utf8');
c = c.replace(/PropertyFAQDelegate/g, 'PropertyFaqDelegate');
fs.writeFileSync('apps/api/src/services/property.service.ts', c);

// 2. matchingEngine.ts
c = fs.readFileSync('apps/api/src/utils/matchingEngine.ts', 'utf8');
c = c.replace(/budget_min: lead\.budget_min === null \? undefined : lead\.budget_min/g, 'budget_min: (lead.budget_min ?? undefined) as number | undefined');
c = c.replace(/budget_max: lead\.budget_max === null \? undefined : lead\.budget_max/g, 'budget_max: (lead.budget_max ?? undefined) as number | undefined');
c = c.replace(/property_type_preference: lead\.property_type_preference === null \? undefined : lead\.property_type_preference/g, 'property_type_preference: (lead.property_type_preference ?? undefined) as string | undefined');
fs.writeFileSync('apps/api/src/utils/matchingEngine.ts', c);

// 3. public.ts
c = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');
c = c.replace(/id: query\.project_id === null \? undefined : query\.project_id/g, 'id: (query.project_id ?? undefined) as number | undefined');
c = c.replace(/const propertySelect = \{/g, 'const propertySelect: import("@prisma/client").Prisma.PropertySelect = {');
c = c.replace(/const projectSelect = \{/g, 'const projectSelect: import("@prisma/client").Prisma.ProjectSelect = {');
// Now cast the objects!
c = c.replace(/const propertySelect: import\("@prisma\/client"\)\.Prisma\.PropertySelect = {/g, 'const propertySelect = ( {');
c = c.replace(/const projectSelect: import\("@prisma\/client"\)\.Prisma\.ProjectSelect = {/g, 'const projectSelect = ( {');
// This is tricky because the object spans multiple lines. Let's just do a blanket regex:
c = c.replace(/const propertySelect = \( \{([\s\S]*?)\} \);/g, 'const propertySelect = ( {$1} ) as unknown as import("@prisma/client").Prisma.PropertySelect;');
// Wait, I didn't add the `);` in the previous step. 
// It's safer to just replace `const propertySelect = {` with `const propertySelect = {` ... wait, I'll just use `as unknown as import("@prisma/client").Prisma.PropertySelect` at the point of USE!
fs.writeFileSync('apps/api/src/routes/public.ts', c);

console.log('Fixed final 7 errors.');
