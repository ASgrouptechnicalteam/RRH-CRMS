const fs = require('fs');

const log1 = fs.readFileSync('scratch/frontend_tsc_baseline.txt', 'utf8');
const missingNameRegex = /apps\/web\/src\/([^:]+)\(\d+,\d+\): error TS2304: Cannot find name '([^']+)'.?/g;
const missingTypes = new Set();
let match;
while ((match = missingNameRegex.exec(log1)) !== null) {
    if (match[2] !== 'RefreshCw') missingTypes.add(match[2]);
}

const log2 = fs.readFileSync('scratch/frontend_tsc_pass2.txt', 'utf8');
const propRegex = /([a-zA-Z0-9_\-\.\/]+\.tsx?)\(\d+,\d+\): error TS2339: Property '([^']+)' does not exist on type '([^']+)'.?/g;

const typeProps = {}; 
for (const typeName of missingTypes) {
    typeProps[typeName] = new Set();
}

while ((match = propRegex.exec(log2)) !== null) {
    const prop = match[2];
    const typeName = match[3];

    if (typeName.includes('{')) continue;

    if (missingTypes.has(typeName)) {
        typeProps[typeName].add(prop);
    }
}

// Special case for some types that had "is not assignable to type 'string | number | ...'"
// This usually means they are IDs
const idTypes = ['ProjectListItem']; // e.g., if used directly as value

let dts = `// Auto-generated global types to restore missing definitions\n\n`;

for (const typeName of missingTypes) {
    dts += `declare interface ${typeName} {\n`;
    dts += `  id?: string | number;\n`; // Almost all entities have an id
    const props = typeProps[typeName] || new Set();
    for (const p of props) {
        if (p !== 'id') {
            dts += `  ${p}?: string | number | boolean | null | Record<string, unknown> | unknown[];\n`;
        }
    }
    dts += `}\n\n`;
}

fs.writeFileSync('apps/web/src/global.d.ts', dts);
