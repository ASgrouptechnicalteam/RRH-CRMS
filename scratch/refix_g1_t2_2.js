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
    content = content.replace(/p\./g, "prisma.");
    fs.writeFileSync(f, content);
  }
});
