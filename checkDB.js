const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'mysql://root:@127.0.0.1:3306/test_db' });

async function main() {
  try {
    const migrations = await prisma.$queryRawUnsafe('SELECT migration_name, finished_at FROM _prisma_migrations');
    console.log('MIGRATIONS:', migrations);
  } catch (e) {
    console.log('MIGRATIONS ERROR:', e.message);
  }

  try {
    const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
    console.log('TABLES:', tables);
  } catch (e) {
    console.log('TABLES ERROR:', e.message);
  }

  try {
    const columns = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM Property');
    console.log('PROPERTY COLUMNS:', columns);
  } catch (e) {
    console.log('PROPERTY COLUMNS ERROR:', e.message);
  }
}

main().finally(() => prisma.$disconnect());
