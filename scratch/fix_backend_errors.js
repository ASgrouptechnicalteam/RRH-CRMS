const fs = require('fs');

let log;
try {
    log = fs.readFileSync('scratch/backend_tsc_1.txt', 'utf16le');
    // if it's actually utf8, the first few chars will be garbage but we can check if it contains 'apps/api'
    if (!log.includes('apps/api')) {
        log = fs.readFileSync('scratch/backend_tsc_1.txt', 'utf8');
    }
} catch (e) {
    log = fs.readFileSync('scratch/backend_tsc_1.txt', 'utf8');
}

const lines = log.split(/\r?\n/);

const fixes = {};

for (const line of lines) {
    // Ignore empty lines
    if (!line.trim()) continue;

    // Remove terminal color codes if any
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
    
    // Match: apps/api/src/routes/admin.ts(82,9): error TS2698: ...
    const match = cleanLine.match(/^\s*([^\(]+)\((\d+),\d+\):\s+error\s+TS(\d+):\s+(.+)/);
    if (!match) continue;
    
    const file = match[1].trim();
    const lineNum = parseInt(match[2], 10);
    const code = match[3];
    const msg = match[4];

    if (!fixes[file]) fixes[file] = [];

    // 'error' is of type 'unknown'
    // 'e' is of type 'unknown'
    // 'event' is of type 'unknown'
    if (code === '18046' || code === '2571') {
        fixes[file].push({ line: lineNum, type: 'unknown_error', msg });
    }
    else if (code === '18048') {
        fixes[file].push({ line: lineNum, type: 'possibly_undefined', msg });
    }
    else if (code === '2339' || code === '2698') {
        fixes[file].push({ line: lineNum, type: 'missing_prop', msg });
    }
    else if (code === '2345') {
        // Argument of type '...' is not assignable to parameter of type '...'
        fixes[file].push({ line: lineNum, type: 'arg_type', msg });
    }
}

let totalFixes = 0;

for (const [file, fileFixes] of Object.entries(fixes)) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    let changed = false;

    // process from bottom to top
    fileFixes.sort((a, b) => b.line - a.line);
    const seenLines = new Set();

    for (const fix of fileFixes) {
        if (seenLines.has(fix.line)) continue;
        seenLines.add(fix.line);
        
        const i = fix.line - 1;
        if (i < 0 || i >= lines.length) continue;
        let l = lines[i];

        const originalL = l;

        if (fix.type === 'unknown_error') {
            l = l.replace(/\berror\./g, '(error as { status?: number; message?: string; code?: string }).');
            l = l.replace(/\be\./g, '(e as { status?: number; message?: string; code?: string }).');
            l = l.replace(/\bevent\./g, '(event as { [key: string]: string | number }).');
            l = l.replace(/\bpayload\./g, '(payload as Record<string, unknown>).');
            l = l.replace(/\bbody\./g, '(body as Record<string, unknown>).');
        }
        else if (fix.type === 'possibly_undefined') {
            l = l.replace(/\bsession\./g, 'session?.');
            l = l.replace(/\bresult\.log\./g, 'result.log?.');
        }
        else if (fix.type === 'missing_prop') {
            l = l.replace(/\berror\./g, '(error as { status?: number; message?: string; code?: string }).');
            l = l.replace(/\be\./g, '(e as { status?: number; message?: string; code?: string }).');
            l = l.replace(/\bdata\./g, '(data as Record<string, unknown>).');
            l = l.replace(/\bresult\./g, '(result as Record<string, unknown>).');
            l = l.replace(/\bcode\b/g, '(error as { code?: string }).code');
            l = l.replace(/\.\.\.body/g, '...(body as Record<string, unknown>)');
            l = l.replace(/\.\.\.event/g, '...(event as Record<string, unknown>)');
        }
        else if (fix.type === 'arg_type') {
             // Often due to passing 'error.message' where string is expected, but we casted it to string?
        }

        if (l !== originalL) {
            lines[i] = l;
            changed = true;
            totalFixes++;
        }
    }

    if (changed) {
        fs.writeFileSync(file, lines.join('\n'));
    }
}

console.log(`Applied ${totalFixes} targeted TS fixes.`);
