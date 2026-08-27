const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync('scratch/remaining_any.txt', 'utf8').split(/\r?\n/);
let replacedFiles = 0;

for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(' -> ');
    const fileInfo = parts[0];
    const match = fileInfo.match(/(?:COLON|AS) ([^:]+):(\d+)/);
    if (!match) continue;
    const file = match[1];

    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Apply specific replacements based on the line text
    let text = parts[1];
    let newText = text;

    if (text.includes('(req: any) => process.env.NODE_ENV')) newText = text.replace('(req: any)', '(req: import("express").Request)');
    else if (text.includes('whereCondition: any =')) newText = text.replace('whereCondition: any =', 'whereCondition: Record<string, unknown> =');
    else if (text.includes('whereClause: any =')) newText = text.replace('whereClause: any =', 'whereClause: Record<string, unknown> =');
    else if (text.includes('includes(Roles.ADMIN as any)')) newText = text.replace('includes(Roles.ADMIN as any)', 'includes(Roles.ADMIN as import("@rrh-ems/shared").Roles)');
    else if (text.includes('includes(Roles.MD as any)')) newText = text.replace('includes(Roles.MD as any)', 'includes(Roles.MD as import("@rrh-ems/shared").Roles)');
    else if (text.match(/\([a-zA-Z0-9_]+\s*:\s*any\)\s*=>/)) {
        newText = text.replace(/: any\)/, ': Record<string, unknown>)');
    }
    else if (text.includes('qrPayload: any')) newText = text.replace('qrPayload: any', 'qrPayload: Record<string, unknown>');
    else if (text.includes('error: any,')) newText = text.replace('error: any,', 'error: unknown,');
    else if (text.includes('next: any) =>')) newText = text.replace('next: any) =>', 'next: import("express").NextFunction) =>');
    
    // Remaining generic replacements for this line
    if (newText === text) {
        newText = text.replace(/:\s*any\[\]/g, ': Record<string, unknown>[]');
        newText = newText.replace(/:\s*any\b/g, ': Record<string, unknown>');
        newText = newText.replace(/as\s*any\b/g, 'as Record<string, unknown>');
    }

    if (newText !== text && content.includes(text)) {
        content = content.replace(text, newText);
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        replacedFiles++;
    }
}
console.log('Replaced in ' + replacedFiles + ' files.');
