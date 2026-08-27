const fs = require('fs');

let ans = fs.readFileSync('apps/api/src/services/analytics.service.ts', 'utf8');
ans = ans.replace(/res: import\('express'\)\.Response/g, "res: any");

// Also there was this: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{}'.
// This is because we have {} and we use an `any` key to index it, like `record[key as any]`.
// Let's just make the object Record<string, any>.
ans = ans.replace(/const bySource: {} = {};/g, "const bySource: Record<string, any> = {};");
ans = ans.replace(/const byStatus: {} = {};/g, "const byStatus: Record<string, any> = {};");
ans = ans.replace(/const byCategory: {} = {};/g, "const byCategory: Record<string, any> = {};");
ans = ans.replace(/const aggregated: {} = {};/g, "const aggregated: Record<string, any> = {};");

fs.writeFileSync('apps/api/src/services/analytics.service.ts', ans);
