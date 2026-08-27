const fs = require('fs');
const path = require('path');

function findAny(dir) {
  let count = 0;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      count += findAny(filePath);
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(/[^a-zA-Z0-9_]any[^a-zA-Z0-9_]/g);
      if (matches) {
        // filter out comments
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('//') && line.indexOf('//') < line.indexOf('any')) return;
          if (/\bany\b/.test(line)) {
            console.log(`${filePath}:${i + 1} - ${line.trim()}`);
            count++;
          }
        });
      }
    }
  });
  return count;
}

const total = findAny(path.join(__dirname, '../apps/api/src'));
console.log(`Total 'any' found: ${total}`);
