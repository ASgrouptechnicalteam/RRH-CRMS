import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

async function main() {
  const testDbUrl = process.env.DATABASE_URL_TEST;
  if (!testDbUrl) throw new Error("No DATABASE_URL_TEST");
  
  process.env.DATABASE_URL = testDbUrl;
  
  const prisma = new PrismaClient({
    datasources: { db: { url: testDbUrl } }
  });

  try {
    const res = await prisma.$queryRaw`SHOW TABLES`;
    console.log('Tables in TEST DB:');
    console.log(res);

    const migrations: any = await prisma.$queryRaw`SELECT * FROM _prisma_migrations`;
    console.log('\nMigrations in TEST DB:');
    console.log(migrations);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
