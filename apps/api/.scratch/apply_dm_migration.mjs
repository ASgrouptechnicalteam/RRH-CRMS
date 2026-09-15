import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`project\`
      ADD COLUMN \`digital_marketing_executive_id\` INTEGER NULL,
      ADD COLUMN \`seo_title\` VARCHAR(191) NULL,
      ADD COLUMN \`seo_keywords\` VARCHAR(191) NULL
  `);
  console.log('columns added');
  const r = await prisma.$executeRawUnsafe(`
    UPDATE \`project\` SET \`verification_status\` = 'PENDING_MD_APPROVAL' WHERE \`verification_status\` = 'PENDING_VERIFICATION'
  `);
  console.log('rows migrated:', r);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX \`Project_digital_marketing_executive_id_idx\` ON \`project\`(\`digital_marketing_executive_id\`)
  `);
  console.log('index created');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`project\` ADD CONSTRAINT \`Project_digital_marketing_executive_id_fkey\` FOREIGN KEY (\`digital_marketing_executive_id\`) REFERENCES \`employee\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log('fk added');
  await prisma.$disconnect();
})();
