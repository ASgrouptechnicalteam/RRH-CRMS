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
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/const p = prisma as any;/g, 'const p = prisma;');
  content = content.replace(/prisma as any/g, 'prisma');
  content = content.replace(/\(tx: any\)/g, '(tx: Prisma.TransactionClient)');
  content = content.replace(/tx:\s*any/g, 'tx: Prisma.TransactionClient');
  content = content.replace(/\(tx as any\)/g, 'tx');
  content = content.replace(/\(client as any\)/g, 'client');
  content = content.replace(/tx\s*=\s*p\s*as\s*any/g, 'tx: Prisma.TransactionClient = p');

  if (content !== original) {
    if (content.includes('Prisma.TransactionClient') && !original.includes('Prisma.TransactionClient')) {
      if (!content.includes('import { PrismaClient, Prisma }')) {
         content = content.replace(/import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"];?/, "import { PrismaClient, Prisma } from '@prisma/client';");
      }
    }
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log('Fixed prisma/tx any in', changed, 'files.');
