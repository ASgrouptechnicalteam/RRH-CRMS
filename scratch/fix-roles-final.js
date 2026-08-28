const fs = require('fs');
const glob = require('glob');

const files = glob.sync('tests/api/**/*.test.ts');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  
  content = content.replaceAll("getCode(Roles.MD)", "getCode('Managing director')");
  content = content.replaceAll("getCode(Roles.TELECALLER)", "getCode('Telecaller')");
  content = content.replaceAll("getCode(Roles.AGENT)", "getCode('Agent')");
  content = content.replaceAll("getCode(Roles.PROJECT_MANAGER)", "getCode('Project manager')");
  content = content.replaceAll("getCode(Roles.FINANCE)", "getCode('Finance')");
  content = content.replaceAll("getCode(Roles.MARKETING_DIRECTOR)", "getCode('Marketing director')");
  content = content.replaceAll("getCode(Roles.DATA_ENTRY)", "getCode('Data entry')");
  content = content.replaceAll("getCode(Roles.SALES_DIRECTOR)", "getCode('Sales director')");

  // Also fix phase3-customer.test.ts
  if (file.includes('phase3-customer.test.ts')) {
      content = content.replaceAll("crossOrgUsers.companyA.telecaller", "deterministicUsers.find(u => u.roles.includes('Telecaller'))!.employee_code");
      content = content.replaceAll("crossOrgUsers.find(u => u.roles.includes(Roles.TELECALLER))?.employee_code", "crossOrgUsers[0].employee_code");
  }

  // Fix packet5-md-approval.test.ts
  if (file.includes('packet5-md-approval.test.ts')) {
      content = content.replaceAll("p.siteVisit.deleteMany({});", "p.siteVisitBooking.deleteMany({});");
  }

  if (content !== orig) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
