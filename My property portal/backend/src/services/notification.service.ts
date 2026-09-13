import prisma from '../utils/prisma';

export const NotificationService = {
  notifyCustomer: async (customerId: string, type: string, title: string, message: string) => {
    try {
      await prisma.notification.create({
        data: {
          userId: customerId,
          userType: 'Customer',
          type,
          title,
          message,
        },
      });
    } catch (err) {
      console.error('Failed to notify customer', err);
    }
  },

  notifyEmployeesByRole: async (
    roleName: string,
    type: string,
    title: string,
    message: string,
    projectId?: string,
  ) => {
    try {
      // Find all employees with the given role
      const employees = await prisma.employee.findMany({
        where: {
          role: { name: roleName },
          ...(projectId ? { assignments: { some: { projectId } } } : {}),
        },
      });

      if (employees.length === 0) return;

      const notifications = employees.map((emp) => ({
        userId: emp.id,
        userType: 'Employee',
        type,
        title,
        message,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    } catch (err) {
      console.error(`Failed to notify ${roleName} employees`, err);
    }
  },
};
