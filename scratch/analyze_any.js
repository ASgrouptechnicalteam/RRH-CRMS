const fs = require('fs');
const { execSync } = require('child_process');

const output = execSync('npx rg "any" apps/api/src --json').toString();
const lines = output.split('\n').filter(Boolean);

let countAsAny = 0;
let countColonAny = 0;
let countPrismaAny = 0;
let countTxAny = 0;
let countCatchAny = 0;

for (const line of lines) {
  try {
    const data = JSON.parse(line);
    if (data.type === 'match') {
      const text = data.data.lines.text;
      if (text.includes('prisma as any')) countPrismaAny++;
      if (text.includes('tx: any') || text.includes('tx as any')) countTxAny++;
      if (text.includes('catch (err: any)')) countCatchAny++;
      if (text.includes(' as any')) countAsAny++;
      if (text.includes(': any')) countColonAny++;
    }
  } catch (e) {}
}

console.log({ countPrismaAny, countTxAny, countCatchAny, countAsAny, countColonAny });
