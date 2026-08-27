const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../apps/api/src'));
let countPrismaAny = 0;
let countTxAny = 0;
let countAsAny = 0;
let countColonAny = 0;
let countUseStateAny = 0;
let countIgnore = 0;
let countExpectError = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('prisma as any')) countPrismaAny++;
  if (content.includes('tx as any')) countTxAny++;
  
  // count occurrences exactly (crude approximation)
  const matchesAsAny = content.match(/ as any/g);
  if (matchesAsAny) countAsAny += matchesAsAny.length;

  const matchesColonAny = content.match(/: any\b/g);
  if (matchesColonAny) countColonAny += matchesColonAny.length;

  const matchesUseStateAny = content.match(/useState<any/g);
  if (matchesUseStateAny) countUseStateAny += matchesUseStateAny.length;

  const matchesIgnore = content.match(/@ts-ignore/g);
  if (matchesIgnore) countIgnore += matchesIgnore.length;

  const matchesExpectError = content.match(/@ts-expect-error/g);
  if (matchesExpectError) countExpectError += matchesExpectError.length;
}

console.log({ countPrismaAny, countTxAny, countAsAny, countColonAny, countUseStateAny, countIgnore, countExpectError });
