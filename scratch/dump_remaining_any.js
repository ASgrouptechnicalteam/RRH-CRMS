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

const files = walk('apps/api/src');
let out = '';
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.match(/: any\b/)) {
      out += 'COLON ' + file.replace(/\\/g, '/') + ':' + (i+1) + ' -> ' + line.trim() + '\n';
    }
    if (line.match(/ as any\b/)) {
      out += 'AS ' + file.replace(/\\/g, '/') + ':' + (i+1) + ' -> ' + line.trim() + '\n';
    }
  });
}
fs.writeFileSync('scratch/remaining_any.txt', out);
console.log('Saved to scratch/remaining_any.txt');
