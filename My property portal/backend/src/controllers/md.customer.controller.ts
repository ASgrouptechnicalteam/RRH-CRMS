import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getCustomersList = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
      },
    });
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving customers list' });
  }
};

export const getCustomer360 = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: id as string },
      include: {
        properties: {
          include: {
            project: {
              include: { company: true },
            },
            emiSchedules: {
              include: {
                installments: {
                  include: { payments: true },
                },
              },
            },
            propertyUpdates: true,
            resaleRequests: true,
          },
        },
        bookings: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch timeline (Notifications + AuditLogs for this customer)
    const notifications = await prisma.notification.findMany({
      where: { userId: customer.id, userType: 'Customer' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Abstracting AuditLogs for timeline
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId: customer.id },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    res.json({
      customer,
      timeline: {
        notifications,
        auditLogs,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving customer 360 data' });
  }
};
