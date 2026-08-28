const { PrismaClient } = require('./node_modules/@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.employee.findFirst({ where: { employee_code: 'RRH-ADMIN-001' } });
    console.log(admin ? 'Found RRH-ADMIN-001' : 'NOT FOUND');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
