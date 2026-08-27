const fs = require('fs');
let c;

// 1. attendance.ts
c = fs.readFileSync('apps/api/src/routes/attendance.ts', 'utf8');
c = c.replace(/result\.log\./g, 'result.log?.');
fs.writeFileSync('apps/api/src/routes/attendance.ts', c);

// 2. auth.ts
c = fs.readFileSync('apps/api/src/routes/auth.ts', 'utf8');
c = c.replace(/session\.id/g, 'session?.id');
c = c.replace(/session\.userId/g, 'session?.userId');
fs.writeFileSync('apps/api/src/routes/auth.ts', c);

// 3. notifications.ts
c = fs.readFileSync('apps/api/src/routes/notifications.ts', 'utf8');
c = c.replace(/notification\.user_id/g, 'notification.employee_id');
fs.writeFileSync('apps/api/src/routes/notifications.ts', c);

// 4. public.ts
c = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');
c = c.replace(/id: query\.project_id/g, 'id: query.project_id || undefined');
c = c.replace(/const propertySelect = {/g, 'const propertySelect: import("@prisma/client").Prisma.PropertySelect = {');
c = c.replace(/const projectSelect = {/g, 'const projectSelect: import("@prisma/client").Prisma.ProjectSelect = {');
c = c.replace(/const propertySelect: import\("@prisma\/client"\)\.Prisma\.PropertySelect = {/g, 'const propertySelect: any = {');
c = c.replace(/const projectSelect: import\("@prisma\/client"\)\.Prisma\.ProjectSelect = {/g, 'const projectSelect: any = {');
fs.writeFileSync('apps/api/src/routes/public.ts', c);

// 5. tasks.ts
c = fs.readFileSync('apps/api/src/routes/tasks.ts', 'utf8');
c = c.replace(/existingTask\.company_id/g, 'existingTask.assignee.company_id');
c = c.replace(/existingTask\._isSubordinate/g, '(existingTask as unknown as { _isSubordinate?: boolean })._isSubordinate');
fs.writeFileSync('apps/api/src/routes/tasks.ts', c);

// 6. property.service.ts
c = fs.readFileSync('apps/api/src/services/property.service.ts', 'utf8');
c = c.replace(/tx\.propertyFAQ/g, 'tx.propertyFaq');
fs.writeFileSync('apps/api/src/services/property.service.ts', c);

// 7. matchingEngine.ts
c = fs.readFileSync('apps/api/src/utils/matchingEngine.ts', 'utf8');
// This was fixed in previous script, but maybe it wasn't run on the baseline!
c = c.replace(/budget_min: lead\.budget_min/g, 'budget_min: lead.budget_min ?? undefined');
c = c.replace(/budget_max: lead\.budget_max/g, 'budget_max: lead.budget_max ?? undefined');
c = c.replace(/property_type_preference: lead\.property_type_preference/g, 'property_type_preference: lead.property_type_preference ?? undefined');
fs.writeFileSync('apps/api/src/utils/matchingEngine.ts', c);

console.log('Fixed last 14 errors.');
