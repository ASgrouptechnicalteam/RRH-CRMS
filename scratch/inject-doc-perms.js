const fs = require('fs');

function injectPermission(file, roleVar) {
  let content = fs.readFileSync(file, 'utf8');
  const snippet = `
    const docPerm = await prisma.permission.upsert({ where: { name: 'documents.create' }, update: {}, create: { name: 'documents.create' }});
    await prisma.rolePermission.createMany({
      data: [{ role_id: ${roleVar}.id, permission_id: docPerm.id }],
      skipDuplicates: true
    });
`;
  if (content.includes('documents.create')) return; // Already injected
  
  content = content.replace(`create: { name: ${roleVar} } });`, `create: { name: ${roleVar} } });${snippet}`);
  // fallback for actual match:
  // e.g. create: { name: Roles.SALES_MANAGER } });
  
  // Actually let's use regex
  const regex = new RegExp(`const ${roleVar} = await prisma\\.role\\.upsert\\(\\{[\\s\\S]*?\\}\\);`);
  const match = content.match(regex);
  if (match) {
     content = content.replace(match[0], match[0] + snippet);
     fs.writeFileSync(file, content);
     console.log('Injected permission into', file);
  } else {
     console.log('Failed to match', roleVar, 'in', file);
  }
}

injectPermission('tests/api/documents-agreement.test.ts', 'salesRole');
injectPermission('tests/api/documents-receipt.test.ts', 'financeRole');
