import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  try {
    const tableCount: any[] =
      await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE()`;
    console.log('DB Connected. Table count:', JSON.stringify(tableCount[0]));

    const [empCount, custCount, projCount, propCount, payCount, roleCount, bookCount, emiCount] =
      await Promise.all([
        prisma.employee.count(),
        prisma.customer.count(),
        prisma.project.count(),
        prisma.property.count(),
        prisma.payment.count(),
        prisma.role.count(),
        prisma.booking.count(),
        prisma.eMISchedule.count(),
      ]);

    console.log(
      'ENTITY COUNTS:',
      JSON.stringify({
        employees: empCount,
        customers: custCount,
        projects: projCount,
        properties: propCount,
        payments: payCount,
        roles: roleCount,
        bookings: bookCount,
        emiSchedules: emiCount,
      }),
    );

    const roles = await prisma.role.findMany({ select: { name: true, id: true } });
    console.log('ROLES:', JSON.stringify(roles));

    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        employeeId: true,
        status: true,
        role: { select: { name: true } },
      },
    });
    console.log('EMPLOYEES:', JSON.stringify(employees));

    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, phone: true, status: true },
    });
    console.log('CUSTOMERS:', JSON.stringify(customers));

    const projects = await prisma.project.findMany({
      select: { id: true, name: true, status: true, company: { select: { name: true } } },
    });
    console.log('PROJECTS:', JSON.stringify(projects));

    const assignments = await prisma.assignment.findMany({
      include: {
        employee: { select: { name: true, role: { select: { name: true } } } },
        project: { select: { name: true } },
      },
    });
    console.log('ASSIGNMENTS:', JSON.stringify(assignments));

    const pendingPayments = await prisma.payment.findMany({
      where: { verificationStatus: 'Pending Verification' },
      include: { installment: { include: { emiSchedule: { include: { property: true } } } } },
    });
    console.log('PENDING_PAYMENTS:', JSON.stringify(pendingPayments));

    console.log('DATABASE CHECK: COMPLETE');
  } catch (e: any) {
    console.error('DB ERROR:', e.message);
    if (e.code) console.error('Error code:', e.code);
  } finally {
    await prisma.$disconnect();
  }
};

main();
