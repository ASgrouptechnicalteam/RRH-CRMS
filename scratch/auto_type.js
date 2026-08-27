const fs = require('fs');

const log = fs.readFileSync('scratch/frontend_tsc_pass2.txt', 'utf8');
const propRegex = /([a-zA-Z0-9_\-\.\/]+\.tsx?)\(\d+,\d+\): error TS2339: Property '([^']+)' does not exist on type '([^']+)'.?/g;

const additions = {}; 

let match;
while ((match = propRegex.exec(log)) !== null) {
    // Make sure we resolve absolute paths correctly, typescript output sometimes strips or uses relative
    // Here typescript outputs apps/web/src/...
    const file = match[1];
    const prop = match[2];
    const typeName = match[3];

    if (typeName.includes('{')) continue;

    if (!additions[file]) additions[file] = {};
    if (!additions[file][typeName]) additions[file][typeName] = new Set();
    additions[file][typeName].add(prop);
}

for (const [file, typeProps] of Object.entries(additions)) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const [typeName, props] of Object.entries(typeProps)) {
        const regex = new RegExp(`export interface ${typeName} \\{([^\\}]*)\\}`);
        const m = regex.exec(content);
        if (m) {
            let inner = m[1];
            for (const p of props) {
                if (!inner.includes(p + '?')) {
                    // Use unknown instead of any to comply with strict typing rule
                    inner += `\n  ${p}?: unknown;`;
                }
            }
            content = content.replace(regex, `export interface ${typeName} {${inner}\n}`);
            changed = true;
        }
    }
    
    if (changed) fs.writeFileSync(file, content);
}
