import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const migrations: any = await prisma.$queryRaw`SELECT * FROM _prisma_migrations`;
  console.log('Migrations in prod DB:');
  console.log(migrations);
}
main().finally(() => prisma.$disconnect());
