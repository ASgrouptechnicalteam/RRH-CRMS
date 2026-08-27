const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('apps/api/src', (filePath) => {
  if (!filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Remove const p = prisma as any
  content = content.replace(/const p = prisma as any;\r?\n/g, '');
  
  // 2. Replace standalone p. with prisma.
  // We use \b to ensure it's a word boundary, but wait, p is a single letter.
  // [^a-zA-Z0-9_]p\. matches if there is no character before p.
  content = content.replace(/(^|[^a-zA-Z0-9_])p\./g, '$1prisma.');

  // 3. Remove (tx: any) => in transaction callbacks
  content = content.replace(/\(tx: any\) =>/g, '(tx) =>');
  
  // 4. Remove (client as any). and (tx as any). and (p.property as any).
  content = content.replace(/\(client as any\)\./g, 'client.');
  content = content.replace(/\(tx as any\)\./g, 'tx.');
  content = content.replace(/\(p\.property as any\)\./g, 'prisma.property.');
  content = content.replace(/\(prisma\.property as any\)\./g, 'prisma.property.');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});
