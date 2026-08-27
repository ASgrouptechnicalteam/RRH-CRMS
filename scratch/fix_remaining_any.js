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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Local object initializations
  content = content.replace(/:\s*any\s*=\s*\{\}/g, ': Record<string, unknown> = {}');
  content = content.replace(/let\s+payload:\s*any;/g, 'let payload: Record<string, unknown> | null = null;');
  content = content.replace(/let\s+body:\s*any;/g, 'let body: Record<string, unknown> | null = null;');
  content = content.replace(/let\s+body:\s*any\s*=\s*null;/g, 'let body: Record<string, unknown> | null = null;');
  content = content.replace(/body:\s*any/g, 'body: Record<string, unknown>');
  content = content.replace(/payload:\s*any/g, 'payload: Record<string, unknown>');
  
  // Array map callbacks
  content = content.replace(/\(\s*([a-zA-Z0-9_]+)\s*:\s*any\s*\)\s*=>/g, '($1: Record<string, unknown>) =>');
  
  // Mongoose / Prisma data variables
  content = content.replace(/data:\s*any/g, 'data: Record<string, unknown>');

  // Error callbacks
  content = content.replace(/error:\s*any/g, 'error: unknown');
  content = content.replace(/err:\s*any/g, 'err: unknown');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
}
console.log('Applied safe generic any fixes.');
