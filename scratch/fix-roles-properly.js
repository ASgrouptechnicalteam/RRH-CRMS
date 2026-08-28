const fs = require('fs');
const glob = require('glob');

const files = glob.sync('tests/api/**/*.test.ts');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;
  
  // Replace the bad hardcoded strings back to Roles.XXX inside getCode() or anywhere it's used exactly
  content = content.replaceAll("getCode('Managing director')", "getCode(Roles.MD)");
  content = content.replaceAll("getCode('Telecaller')", "getCode(Roles.TELECALLER)");
  content = content.replaceAll("getCode('telecallers')", "getCode(Roles.TELECALLER)");
  content = content.replaceAll("getCode('Agent')", "getCode(Roles.AGENT)");
  content = content.replaceAll("getCode('Project manager')", "getCode(Roles.PROJECT_MANAGER)");
  content = content.replaceAll("getCode('Finance')", "getCode(Roles.FINANCE)");
  content = content.replaceAll("getCode('Marketing director')", "getCode(Roles.MARKETING_DIRECTOR)");
  content = content.replaceAll("getCode('Data entry')", "getCode(Roles.DIGITAL_LEAD_OPERATOR)");
  content = content.replaceAll("getCode('Sales director')", "getCode(Roles.SALES_MANAGER)");
  content = content.replaceAll("getCode('Sales manager')", "getCode(Roles.SALES_MANAGER)");

  // Some cases are just includes('Telecaller')
  content = content.replaceAll("includes('Telecaller')", "includes(Roles.TELECALLER)");
  content = content.replaceAll("includes('telecallers')", "includes(Roles.TELECALLER)");
  
  // Check if we need Roles import
  if (content.includes('Roles.') && !content.includes('import { Roles }')) {
    if (content.includes("import { Permissions } from '@rrh-ems/shared';")) {
       content = content.replace("import { Permissions } from '@rrh-ems/shared';", "import { Permissions, Roles } from '@rrh-ems/shared';");
    } else if (content.includes("import { Roles, Permissions }")) {
       // do nothing
    } else if (content.includes("@rrh-ems/shared")) {
       content = content.replace("from '@rrh-ems/shared';", ", Roles } from '@rrh-ems/shared';");
       content = content.replace("{ ,", "{"); // cleanup if bad replacement
    } else {
       content = `import { Roles } from '@rrh-ems/shared';\n` + content;
    }
  }

  if (orig !== content) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
