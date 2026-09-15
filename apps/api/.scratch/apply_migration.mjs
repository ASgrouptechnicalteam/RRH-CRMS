import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`project\` MODIFY \`project_type\` ENUM(
      'PLOTTED','APARTMENT','VILLA','INDEPENDENT_HOUSE','ROW_HOUSE',
      'AGRICULTURAL_LAND','FARM_HOUSE','COMMERCIAL_SHOP','COMMERCIAL_OFFICE',
      'MIXED_RESIDENTIAL','MIXED_USE','TOWNSHIP','GATED_COMMUNITY',
      'MIXED','COMMERCIAL','OTHER'
    ) NULL
  `);
  console.log('applied');
  await prisma.$disconnect();
})();
