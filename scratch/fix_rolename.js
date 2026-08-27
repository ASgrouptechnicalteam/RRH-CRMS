const fs = require('fs');
const path = require('path');

function fixRoleName() {
  const dirs = [
    '../apps/api/src/authz',
    '../apps/api/src/policies',
    '../apps/api/src/routes',
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
      content = content.replace(/as Roles/g, 'as import("@rrh-ems/shared").RoleName');
      content = content.replace(/as import\("@rrh-ems\/shared"\)\.Roles/g, 'as import("@rrh-ems/shared").RoleName');
      
      if (content !== original) {
        fs.writeFileSync(p, content);
        changed++;
      }
    }
  });
  console.log('Fixed RoleName in ' + changed + ' files.');
}
fixRoleName();
