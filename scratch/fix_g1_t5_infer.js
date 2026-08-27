const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

walkDir('apps/api/src', (filePath) => {
  if (!filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove : any from common array method callbacks
  // e.g. .map((r: any) => ...) -> .map((r) => ...)
  content = content.replace(/\(\(([a-zA-Z0-9_]+):\s*any\)\s*=>/g, '(($1) =>');
  
  // also handle single parameter without outer parens if someone typed it? usually it's (r: any)
  // Let's handle (r: any, i: number) -> (r, i: number)
  content = content.replace(/\(([a-zA-Z0-9_]+):\s*any(,\s*[a-zA-Z0-9_]+:\s*[a-zA-Z0-9_]+)?\)\s*=>/g, '($1$2) =>');

  // Change req: any to req: Request (or AuthenticatedRequest if it's there)
  // Just req: any -> req: import('express').Request
  content = content.replace(/req:\s*any/g, "req: import('express').Request");
  content = content.replace(/res:\s*any/g, "res: import('express').Response");
  content = content.replace(/next:\s*any/g, "next: import('express').NextFunction");

  // Change catch (err: any) to catch (err: unknown) - wait, this was already done in Batch 1, but just in case
  content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    modifiedCount++;
    console.log(`Updated ${filePath}`);
  }
});

console.log(`Updated ${modifiedCount} files.`);
