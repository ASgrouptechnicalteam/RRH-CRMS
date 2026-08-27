import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SHOW COLUMNS FROM Lead LIKE 'referral_person_name'`;
    console.log('Result:', result);
    const hasColumn = (result as any[]).length > 0;
    console.log('Has referral_person_name:', hasColumn);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
