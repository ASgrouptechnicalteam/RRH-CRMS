const fs = require('fs');

// Fix tasks.ts
let tasks = fs.readFileSync('apps/api/src/routes/tasks.ts', 'utf8');
tasks = tasks.replace(
  '    existingTask.company_id = existingTask.assignee?.company_id;\n    const downstreamIds = await getDownstreamEmployeeIds(req.user!.companyId, employeeId);\n    existingTask._isSubordinate = downstreamIds.includes(existingTask.assignee_id);\n\n    if (!can(req.user!, Permissions.TASKS_UPDATE, existingTask)) {',
  `    const downstreamIds = await getDownstreamEmployeeIds(req.user!.companyId, employeeId);
    const authzContext = {
      ...existingTask,
      company_id: existingTask.assignee?.company_id,
      _isSubordinate: downstreamIds.includes(existingTask.assignee_id)
    };

    if (!can(req.user!, Permissions.TASKS_UPDATE, authzContext as any)) {`
);
fs.writeFileSync('apps/api/src/routes/tasks.ts', tasks);
console.log('Fixed tasks.ts');

// Fix property.service.ts
let propertyService = fs.readFileSync('apps/api/src/services/property.service.ts', 'utf8');
propertyService = propertyService.replace('await prisma.propertyFAQ.createMany', 'await prisma.propertyFaq.createMany');
fs.writeFileSync('apps/api/src/services/property.service.ts', propertyService);
console.log('Fixed property.service.ts');

// Fix customer.service.ts
let customerService = fs.readFileSync('apps/api/src/services/customer.service.ts', 'utf8');
customerService = customerService.replace('private static async generateNextCustomerCode(tx: any = p): Promise<string> {', 'private static async generateNextCustomerCode(tx: any = prisma): Promise<string> {');
fs.writeFileSync('apps/api/src/services/customer.service.ts', customerService);
console.log('Fixed customer.service.ts');

// Fix matchingEngine.ts
let matchingEngine = fs.readFileSync('apps/api/src/utils/matchingEngine.ts', 'utf8');
matchingEngine = matchingEngine.replace(
  '          budget_min: prop.price,\n          budget_max: prop.price,',
  '          budget_min: prop.price || undefined,\n          budget_max: prop.price || undefined,'
);
matchingEngine = matchingEngine.replace(
  '          category: prop.category,',
  '          category: prop.category || undefined,'
);
fs.writeFileSync('apps/api/src/utils/matchingEngine.ts', matchingEngine);
console.log('Fixed matchingEngine.ts');
