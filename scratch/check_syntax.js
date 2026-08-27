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
    // Replace:
    //         ] as string[]).includes(r)
    // with:
    //         ] as string[]).includes(r) -> wait, it's inside `user.roles.some((r) => [...])`
    // If it's `] as string[]).includes(r)`, I just need to add a `(` before the array.
    // Let's just look at what it actually produced.
    console.log(content.match(/.*\] as string\[\]\)\.includes\(r\)/g));
  }
});
