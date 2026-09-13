import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    // STRICT RULE: Only count Approved payments
    const approvedPayments = await prisma.payment.aggregate({
      where: { verificationStatus: 'Approved' },
      _sum: { amount: true },
    });

    const totalExpected = await prisma.installment.aggregate({
      _sum: { amountDue: true },
    });

    // Time series for collection analytics (group by month, simplified for prototype)
    const recentPayments = await prisma.payment.findMany({
      where: { verificationStatus: 'Approved' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({
      totalCollected: approvedPayments._sum.amount || 0,
      totalExpected: totalExpected._sum.amountDue || 0,
      recentPayments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch revenue report' });
  }
};

export const getCompanyComparison = async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    // Fetch properties per company to get total value
    const report = await Promise.all(
      companies.map(async (company: any) => {
        const properties = await prisma.property.findMany({
          where: { project: { companyId: company.id } },
          select: { price: true, status: true },
        });

        const totalValue = properties.reduce((sum: number, p: any) => sum + p.price, 0);
        const soldCount = properties.filter(
          (p: any) => p.status === 'Sold' || p.status === 'Registered',
        ).length;

        return {
          companyName: company.name,
          totalProjects: company._count.projects,
          totalProperties: properties.length,
          soldProperties: soldCount,
          totalValue,
        };
      }),
    );

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch company comparison' });
  }
};

export const getProjectAnalytics = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      select: {
        name: true,
        developmentStatus: true,
        constructionStatus: true,
        _count: { select: { properties: true } },
      },
    });

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch project analytics' });
  }
};

export const getCustomerAnalytics = async (req: Request, res: Response) => {
  try {
    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({ where: { status: 'Active' } });

    // Customers with multiple properties
    const customersWithProps = await prisma.customer.findMany({
      select: { _count: { select: { properties: true } } },
    });

    const multiPropertyCount = customersWithProps.filter(
      (c: any) => c._count.properties > 1,
    ).length;

    res.json({
      totalCustomers,
      activeCustomers,
      multiPropertyCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch customer analytics' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200, // Limit for prototype performance
    });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};
