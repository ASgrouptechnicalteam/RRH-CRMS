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
  
  await prisma.employeeRole.deleteMany({
    where: { employee: { employee_code: { not: 'RRH-ADMIN-001' } } }
  });
  await prisma.employeePermissionOverride.deleteMany({
    where: { employee: { employee_code: { not: 'RRH-ADMIN-001' } } }
  });
  await prisma.employee.deleteMany({
    where: { employee_code: { not: 'RRH-ADMIN-001' } }
  });
  
  // Wipe everything else
  await prisma.property.deleteMany({});

  
  console.log('Sample data and old employees (except Admin) successfully wiped from production database!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
