const fs = require('fs');

let c = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');

c = c.replace(/select: PUBLIC_PROPERTY_SELECT,/g, 'select: PUBLIC_PROPERTY_SELECT as import("@prisma/client").Prisma.PropertySelect,');
c = c.replace(/select: PUBLIC_PROPERTY_DETAIL_SELECT,/g, 'select: PUBLIC_PROPERTY_DETAIL_SELECT as import("@prisma/client").Prisma.PropertySelect,');
c = c.replace(/select: PUBLIC_PROJECT_SELECT,/g, 'select: PUBLIC_PROJECT_SELECT as import("@prisma/client").Prisma.ProjectSelect,');
c = c.replace(/select: PUBLIC_PROJECT_DETAIL_SELECT,/g, 'select: PUBLIC_PROJECT_DETAIL_SELECT as import("@prisma/client").Prisma.ProjectSelect,');

fs.writeFileSync('apps/api/src/routes/public.ts', c);
console.log('Fixed PUBLIC_ selects in public.ts');
