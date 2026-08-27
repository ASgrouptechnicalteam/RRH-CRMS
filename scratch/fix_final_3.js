const fs = require('fs');

// 1. matchingEngine.ts
let c = fs.readFileSync('apps/api/src/utils/matchingEngine.ts', 'utf8');
c = c.replace(/bedrooms: prop\.bedrooms,/g, 'bedrooms: (prop.bedrooms ?? undefined) as number | undefined,');
c = c.replace(/facing: prop\.facing,/g, 'facing: (prop.facing ?? undefined) as string | undefined,');
fs.writeFileSync('apps/api/src/utils/matchingEngine.ts', c);

// 2. public.ts
c = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');
c = c.replace(/company_id: companyId,/g, 'company_id: companyId as number,');
fs.writeFileSync('apps/api/src/routes/public.ts', c);

console.log('Fixed final 3 TS errors.');
