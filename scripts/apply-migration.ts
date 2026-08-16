import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Reading migration file...');
  const sqlContent = fs.readFileSync(path.resolve(process.cwd(), 'scripts/diff.sql'), 'utf8');
  
  // Split statements by semicolon, ignoring empty ones
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log(`Found ${statements.length} statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`Success.`);
    } catch (error: any) {
      console.error(`Error executing statement ${i + 1}: ${error.message}`);
      process.exit(1);
    }
  }

  console.log('\nMigration applied successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
