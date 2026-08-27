const fs = require('fs');

// Fix auth.ts
let auth = fs.readFileSync('apps/api/src/routes/auth.ts', 'utf8');
auth = auth.replace(
  "return res.status(result.status).json({ error: result.error, code: 'UNAUTHORIZED' });",
  "return res.status(result.status || 401).json({ error: result.error, code: 'UNAUTHORIZED' });"
);
fs.writeFileSync('apps/api/src/routes/auth.ts', auth);
console.log('Fixed auth.ts');

// Fix matchingEngine.ts
let matchingEngine = fs.readFileSync('apps/api/src/utils/matchingEngine.ts', 'utf8');
matchingEngine = matchingEngine.replace('bedrooms: prop.bedrooms,', 'bedrooms: prop.bedrooms ?? undefined,');
matchingEngine = matchingEngine.replace('facing: prop.facing,', 'facing: prop.facing ?? undefined,');
fs.writeFileSync('apps/api/src/utils/matchingEngine.ts', matchingEngine);
console.log('Fixed matchingEngine.ts');

// Fix public.ts
let pub = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');
// Change orderBy: { created_at: 'desc' } to orderBy: { created_at: Prisma.SortOrder.desc }
// Actually, Prisma uses 'desc' string literal. So just 'desc' as Prisma.SortOrder is fine.
// But earlier I just stripped 'as const'. 
pub = pub.replace("orderBy: { created_at: 'desc' },", "orderBy: { created_at: 'desc' as import('@prisma/client').Prisma.SortOrder },");
fs.writeFileSync('apps/api/src/routes/public.ts', pub);
console.log('Fixed public.ts');
