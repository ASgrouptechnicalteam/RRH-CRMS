const fs = require('fs');
const glob = require('glob');
const files = glob.sync('apps/api/src/**/*.ts');
let totalReplaced = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  newContent = newContent.replace(/catch \((\w+): any\)/g, 'catch ($1: unknown)');
  newContent = newContent.replace(/req: any/g, 'req: import("express").Request & { apiKeyContext?: unknown; user?: import("../authz/authorization").TokenPayload; file?: unknown }');
  newContent = newContent.replace(/res: any/g, 'res: import("express").Response');
  newContent = newContent.replace(/next: any/g, 'next: import("express").NextFunction');
  
  newContent = newContent.replace(/body: any/g, 'body: unknown');
  newContent = newContent.replace(/payload: any/g, 'payload: unknown');
  newContent = newContent.replace(/event: any/g, 'event: unknown');
  newContent = newContent.replace(/data: any/g, 'data: Record<string, unknown>');
  newContent = newContent.replace(/dto: any/g, 'dto: Record<string, unknown>');
  newContent = newContent.replace(/where: any/g, 'where: Record<string, unknown>');
  newContent = newContent.replace(/const (\w+): any = \{/g, 'const $1: Record<string, unknown> = {');
  newContent = newContent.replace(/let (\w+): any =/g, 'let $1: unknown =');
  
  // as any -> as unknown
  newContent = newContent.replace(/as any/g, 'as unknown');
  // fallback for any remaining : any
  newContent = newContent.replace(/: any/g, ': unknown');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    totalReplaced++;
  }
}
console.log('Replaced any in ' + totalReplaced + ' files');
