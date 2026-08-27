const fs = require('fs');
const path = require('path');

function fixRolesAndAuthz() {
  const dirs = [
    '../apps/api/src/authz',
    '../apps/api/src/policies',
  ];
  let changed = 0;
  dirs.forEach(dir => {
    const absDir = path.join(__dirname, dir);
    if (!fs.existsSync(absDir)) return;
    const files = fs.readdirSync(absDir).filter(f => f.endsWith('.ts'));
    for (const file of files) {
      const p = path.join(absDir, file);
      let content = fs.readFileSync(p, 'utf8');
      const original = content;

      // fix includes(r as ...) -> includes(r as never)
      content = content.replace(/\.includes\(r\s*as\s*import\("@rrh-ems\/shared"\)\.RoleName\)/g, '.includes(r as never)');
      content = content.replace(/\.includes\(r\s*as\s*RoleName\)/g, '.includes(r as never)');

      if (file === 'authorization.ts') {
        content = content.replace(/,\s*resource\)/g, ', resource as never)');
      }

      if (content !== original) {
        fs.writeFileSync(p, content);
        changed++;
      }
    }
  });
  console.log('Fixed RoleName/authz in ' + changed + ' files.');
}
fixRolesAndAuthz();
