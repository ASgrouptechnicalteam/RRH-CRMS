const fs = require('fs');
const glob = require('glob');
const files = glob.sync('apps/api/src/**/*.ts');
let totalReverted = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  newContent = newContent.replace(/catch \((\w+): unknown\)/g, 'catch ($1: any)');
  newContent = newContent.replace(/req: import\("express"\)\.Request & \{ apiKeyContext\?: unknown; user\?: import\("\.\.\/authz\/authorization"\)\.TokenPayload; file\?: unknown \}/g, 'req: any');
  newContent = newContent.replace(/res: import\("express"\)\.Response/g, 'res: any');
  newContent = newContent.replace(/next: import\("express"\)\.NextFunction/g, 'next: any');
  
  newContent = newContent.replace(/body: unknown/g, 'body: any');
  newContent = newContent.replace(/payload: unknown/g, 'payload: any');
  newContent = newContent.replace(/event: unknown/g, 'event: any');
  newContent = newContent.replace(/data: Record<string, unknown>/g, 'data: any');
  newContent = newContent.replace(/dto: Record<string, unknown>/g, 'dto: any');
  newContent = newContent.replace(/where: Record<string, unknown>/g, 'where: any');
  newContent = newContent.replace(/const (\w+): Record<string, unknown> = \{/g, 'const $1: any = {');
  newContent = newContent.replace(/let (\w+): unknown =/g, 'let $1: any =');
  
  // as unknown -> as any
  newContent = newContent.replace(/as unknown/g, 'as any');
  // fallback for any remaining : unknown
  newContent = newContent.replace(/: unknown/g, ': any');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    totalReverted++;
  }
}
console.log('Reverted unknown to any in ' + totalReverted + ' files');
