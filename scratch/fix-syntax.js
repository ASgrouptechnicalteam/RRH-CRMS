const fs = require('fs');
const glob = require('glob');
const files = glob.sync('tests/api/**/*.test.ts');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("import { Permissions, Roles } , Roles } from '@rrh-ems/shared';")) {
    content = content.replace("import { Permissions, Roles } , Roles } from '@rrh-ems/shared';", "import { Permissions, Roles } from '@rrh-ems/shared';");
    fs.writeFileSync(file, content);
    console.log('Fixed syntax in', file);
  }
}
