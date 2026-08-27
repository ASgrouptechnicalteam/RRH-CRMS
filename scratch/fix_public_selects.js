const fs = require('fs');

let c = fs.readFileSync('apps/api/src/routes/public.ts', 'utf8');
c = c.replace(/const propertySelect: import\("@prisma\/client"\)\.Prisma\.PropertySelect = \{/g, 'const propertySelect = {');
c = c.replace(/const projectSelect: import\("@prisma\/client"\)\.Prisma\.ProjectSelect = \{/g, 'const projectSelect = {');

c = c.replace(/select: propertySelect,/g, 'select: propertySelect as import("@prisma/client").Prisma.PropertySelect,');
c = c.replace(/select: projectSelect,/g, 'select: projectSelect as import("@prisma/client").Prisma.ProjectSelect,');

fs.writeFileSync('apps/api/src/routes/public.ts', c);
console.log('Fixed public.ts selects');
