import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // --- Customers ---
    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({ where: { status: 'Active' } });
    const newCustomers = await prisma.customer.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const multiPropertyCustomers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { properties: true },
        },
      },
      where: {
        properties: { some: {} }, // at least one property
      },
    });
    const multiCount = multiPropertyCustomers.filter((c: any) => c._count.properties > 1).length;

    // --- Financial ---
    // Only approved payments count toward collected amounts.
    const allInstallments = await prisma.installment.findMany({
      include: {
        payments: {
          where: { verificationStatus: 'Approved' },
        },
      },
    });

    let totalExpected = 0;
    let totalCollected = 0;
    let pending = 0;
    let late = 0;
    let monthlyCollection = 0;
    let yearlyCollection = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    for (const inst of allInstallments) {
      totalExpected += inst.amountDue;

      const collectedForInst = inst.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      totalCollected += collectedForInst;

      const remaining = inst.amountDue - collectedForInst;

      if (remaining > 0) {
        if (inst.dueDate < new Date()) {
          late += remaining;
        } else {
          pending += remaining;
        }
      }

      // Time-based aggregation for approved payments
      for (const p of inst.payments) {
        const pDate = new Date(p.createdAt);
        if (pDate.getFullYear() === currentYear) {
          yearlyCollection += p.amount;
          if (pDate.getMonth() === currentMonth) {
            monthlyCollection += p.amount;
          }
        }
      }
    }

    const collectionRate =
      totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(2) : 0;

    // --- Projects ---
    const projects = await prisma.project.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const getProjCount = (status: string) =>
      projects.find((p: any) => p.status === status)?._count.id || 0;
    const totalProjects = projects.reduce((acc: number, curr: any) => acc + curr._count.id, 0);

    // --- Properties ---
    const properties = await prisma.property.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const getPropCount = (status: string) =>
      properties.find((p: any) => p.status === status)?._count.id || 0;

    res.json({
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        new: newCustomers,
        multipleProperty: multiCount,
      },
      financial: {
        expected: totalExpected,
        collected: totalCollected,
        pending: pending,
        late: late,
        monthlyCollection,
        yearlyCollection,
        collectionRate: Number(collectionRate),
      },
      projects: {
        total: totalProjects,
        active: getProjCount('Active'),
        completed: getProjCount('Completed'),
        upcoming: getProjCount('Upcoming'),
        suspended: getProjCount('Suspended'),
      },
      properties: {
        available: getPropCount('Available'),
        reserved: getPropCount('Reserved'),
        booked: getPropCount('Booked'),
        sold: getPropCount('Sold'),
        registered: getPropCount('Registered'),
        resale: getPropCount('Resale'),
        cancelled: getPropCount('Cancelled'),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error aggregating dashboard metrics' });
  }
};
