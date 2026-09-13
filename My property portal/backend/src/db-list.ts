import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  try {
    const cp: any[] = await prisma.$queryRawUnsafe('SHOW TABLES FROM `customer_portal`');
    console.log('customer_portal tables:', JSON.stringify(cp));
    const sl: any[] = await prisma.$queryRawUnsafe('SHOW TABLES FROM `sonthillu_db`');
    console.log('sonthillu_db tables:', JSON.stringify(sl));
  } catch (e: any) {
    console.error('DB ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
};

main();
