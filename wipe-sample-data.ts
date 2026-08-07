import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Wiping sample data...');
  
  await prisma.attendanceLog.deleteMany({});
  await prisma.auditEvent.deleteMany({});
  await prisma.dailyReport.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.performanceSnapshot.deleteMany({});
  await prisma.dailyTarget.deleteMany({});
  await prisma.employeeQrCode.deleteMany({});
  
  // We keep the main Roles, Branches, Shifts, and Employees so you can still log in!
  console.log('Sample data successfully wiped!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
