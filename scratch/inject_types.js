const fs = require('fs');

const log = fs.readFileSync('scratch/frontend_tsc_baseline.txt', 'utf8');
const missingNameRegex = /apps\/web\/src\/([^:]+)\(\d+,\d+\): error TS2304: Cannot find name '([^']+)'.?/g;

const missingTypesByFile = {};
let match;
while ((match = missingNameRegex.exec(log)) !== null) {
    const file = 'apps/web/src/' + match[1];
    const typeName = match[2];
    if (!missingTypesByFile[file]) {
        missingTypesByFile[file] = new Set();
    }
    missingTypesByFile[file].add(typeName);
}

for (const [file, types] of Object.entries(missingTypesByFile)) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    let added = false;
    for (const typeName of types) {
        if (typeName === 'RefreshCw') {
            content = content.replace(/import \{ ([^\}]+) \} from 'lucide-react';/, (m, p1) => {
                if (p1.includes('RefreshCw')) return m;
                return `import { ${p1}, RefreshCw } from 'lucide-react';`;
            });
            added = true;
            continue;
        }
        
        if (content.includes(`interface ${typeName}`) || content.includes(`type ${typeName}`)) {
            continue;
        }
        
        const interfaceStr = `\nexport interface ${typeName} {}\n`;
        
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLine = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, endOfLine + 1) + interfaceStr + content.slice(endOfLine + 1);
            added = true;
        } else {
            content = interfaceStr + content;
            added = true;
        }
    }
    if (added) {
        fs.writeFileSync(file, content);
    }
}
