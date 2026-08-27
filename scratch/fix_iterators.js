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
  const original = content;

  // Remove explicit type from iterators because Prisma infers them perfectly
  content = content.replace(/\(e: Record<string, unknown>\) =>/g, '(e) =>');
  content = content.replace(/\(a: Record<string, unknown>\) =>/g, '(a) =>');
  content = content.replace(/\(l: Record<string, unknown>\) =>/g, '(l) =>');
  content = content.replace(/\(r: Record<string, unknown>\) =>/g, '(r) =>');
  content = content.replace(/\(rp: Record<string, unknown>\) =>/g, '(rp) =>');
  content = content.replace(/\(po: Record<string, unknown>\) =>/g, '(po) =>');
  content = content.replace(/\(emp: Record<string, unknown>\) =>/g, '(emp) =>');
  content = content.replace(/\(item: Record<string, unknown>\) =>/g, '(item) =>');
  content = content.replace(/\(lead: Record<string, unknown>\) =>/g, '(lead) =>');
  content = content.replace(/\(acc: Record<string, number>, lead: Record<string, unknown>\) =>/g, '(acc, lead) =>');
  content = content.replace(/\(acc: Record<string, number>, item: Record<string, unknown>\) =>/g, '(acc, item) =>');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log('Fixed iterator types in ' + changed + ' files.');
