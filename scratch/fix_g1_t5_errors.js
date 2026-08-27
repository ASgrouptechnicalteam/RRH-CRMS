const fs = require('fs');

function revertReq(f) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/req: import\('express'\)\.Request/g, "req: any");
  content = content.replace(/res: import\('express'\)\.Response/g, "res: any");
  content = content.replace(/next: import\('express'\)\.NextFunction/g, "next: any");
  fs.writeFileSync(f, content);
}

revertReq('apps/api/src/routes/booking.routes.ts');
revertReq('apps/api/src/routes/complaint.routes.ts');
revertReq('apps/api/src/routes/installment.routes.ts');
revertReq('apps/api/src/routes/payment.routes.ts');
revertReq('apps/api/src/routes/public.ts');
revertReq('apps/api/src/services/complaint.service.ts');

// customers.ts
let cust = fs.readFileSync('apps/api/src/routes/customers.ts', 'utf8');
cust = cust.replace(/catch \((error)\)/g, "catch (error: any)");
fs.writeFileSync('apps/api/src/routes/customers.ts', cust);

// leads.ts
let leads = fs.readFileSync('apps/api/src/routes/leads.ts', 'utf8');
leads = leads.replace(/catch \((error)\)/g, "catch (error: any)");
fs.writeFileSync('apps/api/src/routes/leads.ts', leads);

// kyc.service.ts
let kyc = fs.readFileSync('apps/api/src/services/kyc.service.ts', 'utf8');
kyc = kyc.replace(/\(d\) =>/g, "(d: any) =>");
fs.writeFileSync('apps/api/src/services/kyc.service.ts', kyc);

// searchIntentBridge.ts
let sib = fs.readFileSync('apps/api/src/services/ai/searchIntentBridge.ts', 'utf8');
sib = sib.replace(/\(args\) =>/g, "(args: any) =>");
fs.writeFileSync('apps/api/src/services/ai/searchIntentBridge.ts', sib);

// opportunity.workflow.ts
let opp = fs.readFileSync('apps/api/src/workflows/opportunity.workflow.ts', 'utf8');
opp = opp.replace(/\(v\) =>/g, "(v: any) =>");
fs.writeFileSync('apps/api/src/workflows/opportunity.workflow.ts', opp);

// analytics.service.ts
let ans = fs.readFileSync('apps/api/src/services/analytics.service.ts', 'utf8');
ans = ans.replace(/\(r\) =>/g, "(r: any) =>");
fs.writeFileSync('apps/api/src/services/analytics.service.ts', ans);

// employees.ts
let emp = fs.readFileSync('apps/api/src/routes/employees.ts', 'utf8');
emp = emp.replace(/delete (employee)\.password_hash;/g, "delete (employee as any).password_hash;");
emp = emp.replace(/delete (employee)\.created_at;/g, "delete (employee as any).created_at;");
emp = emp.replace(/delete (employee)\.updated_at;/g, "delete (employee as any).updated_at;");
emp = emp.replace(/delete (employee)\.otp_secret;/g, "delete (employee as any).otp_secret;");
emp = emp.replace(/delete (employee)\.push_subscription;/g, "delete (employee as any).push_subscription;");
emp = emp.replace(/delete (employee)\.token_version;/g, "delete (employee as any).token_version;");
emp = emp.replace(/employee\.salaryCtc =/g, "(employee as any).salaryCtc =");
fs.writeFileSync('apps/api/src/routes/employees.ts', emp);
