const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'mysql://root:@127.0.0.1:3306/test_db' } }
});

async function main() {
  try {
    const res = await prisma.$queryRaw`DESCRIBE Lead;`;
    console.log(res.find(c => c.Field === 'exit_reason'));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
