const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../apps/api/src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Array maps
  content = content.replace(/\((?:[a-zA-Z0-9_]+)\s*:\s*any\)\s*=>/g, (match) => {
      return match.replace(': any', ': Record<string, unknown>');
  });

  // 2. data payloads
  content = content.replace(/data:\s*any/g, 'data: Record<string, unknown>');
  content = content.replace(/payload:\s*any/g, 'payload: Record<string, unknown>');
  content = content.replace(/body:\s*any/g, 'body: Record<string, unknown>');
  content = content.replace(/event:\s*any/g, 'event: Record<string, unknown>');

  // 3. remaining : any -> if it has [], replace with Record<string, unknown>[]
  content = content.replace(/:\s*any\[\]/g, ': Record<string, unknown>[]');

  // 4. as any -> as Record<string, unknown>
  // Exclude tx as any (handled earlier, but just in case)
  content = content.replace(/\b(?!tx\b)[a-zA-Z0-9_]+\s+as\s+any\b/g, (match) => {
      return match.replace('as any', 'as Record<string, unknown>');
  });

  // 5. any remaining ": any"
  content = content.replace(/:\s*any\b/g, ': Record<string, unknown>');
  
  // 6. Prisma bypasses
  content = content.replace(/const p = prisma as Record<string, unknown>;/g, 'const p = prisma;');
  content = content.replace(/tx as Record<string, unknown>/g, 'tx: Prisma.TransactionClient');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
  }
}

console.log('Done replacing any.');
