const fs = require('fs');

function replaceAll(f, search, replace) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(f, content);
}

const files = [
  'apps/api/src/routes/admin.ts',
  'apps/api/src/routes/md.ts',
  'apps/api/src/routes/public.ts',
  'apps/api/src/routes/targets.ts',
  'apps/api/src/routes/tasks.ts',
  'apps/api/src/services/booking.service.ts',
  'apps/api/src/services/lead.service.ts'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/const p = prisma as any;\n/g, "");
    content = content.replace(/p\./g, "prisma.");
    
    // booking.service.ts specifically
    if (f.includes('booking.service.ts')) {
      content = content.replace(/\(client as any\)\./g, "client.");
      content = content.replace(/\(tx as any\)\./g, "tx.");
      content = content.replace(/\(prisma\.property as any\)\./g, "prisma.property.");
    }

    fs.writeFileSync(f, content);
  }
});
