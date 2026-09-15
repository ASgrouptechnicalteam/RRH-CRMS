import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  try {
    const rows = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM attendanceproposal WHERE Field = 'leave_type'`);
    console.log('DB column:', rows);
  } catch (e) {
    console.log('ERROR:', e.message);
  }
  await prisma.$disconnect();
})();
