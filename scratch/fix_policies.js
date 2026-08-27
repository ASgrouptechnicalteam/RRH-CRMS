const fs = require('fs');

const files = [
  'apps/api/src/policies/booking.policy.ts',
  'apps/api/src/policies/customer.policy.ts',
  'apps/api/src/policies/lead.policy.ts',
  'apps/api/src/policies/opportunity.policy.ts',
  'apps/api/src/policies/payment.policy.ts',
  'apps/api/src/policies/project.policy.ts',
  'apps/api/src/policies/property.policy.ts',
  'apps/api/src/policies/siteVisit.policy.ts'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // It's currently: 
    //        ] as string[]).includes(r)
    // We want to revert it back to the clean way:
    //        ].includes(r as Roles)
    content = content.replace(/\] as string\[\]\)\.includes\(r\)/g, "].includes(r as Roles)");
    fs.writeFileSync(f, content);
  }
});

// Also in dataScope.ts
let dScope = fs.readFileSync('apps/api/src/authz/dataScope.ts', 'utf8');
dScope = dScope.replace(/\(MANAGEMENT_ROLES as string\[\]\)\.includes\(r\)/g, "MANAGEMENT_ROLES.includes(r as Roles)");
dScope = dScope.replace(/\(KYC_AUTHORIZED_ROLES as string\[\]\)\.includes\(r\)/g, "KYC_AUTHORIZED_ROLES.includes(r as Roles)");
dScope = dScope.replace(/\(\[Roles\.MD, Roles\.HR_MANAGER\] as string\[\]\)\.includes\(r\)/g, "[Roles.MD, Roles.HR_MANAGER].includes(r as Roles)");
fs.writeFileSync('apps/api/src/authz/dataScope.ts', dScope);

