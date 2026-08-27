const fs = require('fs');

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
    content = content.replace(/const p = prisma as any;(\r?\n)?/g, "");
    content = content.replace(/\bp\./g, "prisma.");
    
    // booking.service.ts specifically
    if (f.includes('booking.service.ts')) {
      content = content.replace(/\(client as any\)\./g, "client.");
      content = content.replace(/\(tx as any\)\./g, "tx.");
      content = content.replace(/\(prisma\.property as any\)\./g, "prisma.property.");
    }
    
    // lead.service.ts specifically
    if (f.includes('lead.service.ts')) {
      content = content.replace(/errors: \[\] as any\[\]/g, "errors: [] as { row: number, error: string, reason?: string }[]");
      content = content.replace(/reason: /g, "error: "); // just in case it had reason property instead of error
    }

    fs.writeFileSync(f, content);
  }
});
