const fs = require('fs');
const path = require('path');

const replacements = {
  'neutral-charcoal': 'text-primary',
  'neutral-slate': 'text-secondary',
  'neutral-muted': 'text-muted',
  'neutral-border': 'border',
  'neutral-surface': 'surface-muted',
  'neutral-white': 'white',
  'status-success': 'success',
  'status-warning': 'warning',
  'status-error': 'error',
  'status-info': 'info'
};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  for (const [key, value] of Object.entries(replacements)) {
    if (content.includes(key)) {
      content = content.split(key).join(value);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modified:', file);
  }
});
