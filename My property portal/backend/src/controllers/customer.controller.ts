import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { NotificationService } from '../services/notification.service';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;

    // Strict Data Isolation: Only query based on customerId
    const activeProperties = await prisma.property.count({
      where: { customerId },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: customerId, userType: 'Customer' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      activeProperties,
      notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
};

export const getMyProperties = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;

    const properties = await prisma.property.findMany({
      where: { customerId },
      include: {
        project: {
          select: { name: true, location: true, company: { select: { name: true } } },
        },
      },
    });

    res.json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve properties' });
  }
};

export const getPropertyDetails = async (req: Request, res: Response) => {
  try {
    const { id: propertyId } = req.params;

    const property = await prisma.property.findFirst({
      where: { customerId: req.user!.id, id: propertyId as string },
      include: {
        project: {
          select: {
            name: true,
            location: true,
            projectUpdates: { orderBy: { createdAt: 'desc' } },
            locationUpdates: { orderBy: { createdAt: 'desc' } },
          },
        },
        propertyUpdates: { orderBy: { createdAt: 'desc' } },
        marketValueHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    res.json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve property details' });
  }
};

export const getFinancials = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.query;
    const whereClause: any = {
      property: { customerId: req.user!.id },
    };
    if (propertyId) whereClause.propertyId = propertyId as string;

    const schedules = await prisma.eMISchedule.findMany({
      where: whereClause,
      include: {
        installments: {
          include: {
            payments: {
              include: { paymentProof: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    const processedSchedules = schedules.map((schedule: any) => {
      let totalScheduleExpected = 0;
      let totalScheduleCollected = 0;

      const processedInstallments = schedule.installments.map((inst: any) => {
        totalScheduleExpected += inst.amountDue;

        const collected = inst.payments
          .filter((p: any) => p.verificationStatus === 'Approved')
          .reduce((sum: number, p: any) => sum + p.amount, 0);

        totalScheduleCollected += collected;

        return {
          ...inst,
          collectedAmount: collected,
          remainingAmount: inst.amountDue - collected,
          allPayments: inst.payments,
        };
      });

      return {
        ...schedule,
        totalScheduleExpected,
        totalScheduleCollected,
        totalRemaining: totalScheduleExpected - totalScheduleCollected,
        installments: processedInstallments,
      };
    });

    res.json(processedSchedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve financial ledger' });
  }
};

export const requestResale = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;
    const { propertyId, expectedPrice, reason } = req.body;

    const property = await prisma.property.findFirst({ where: { id: propertyId, customerId } });
    if (!property) return res.status(404).json({ message: 'Unauthorized' });

    const resale = await prisma.resaleRequest.create({
      data: {
        propertyId: propertyId as string,
        expectedPrice: Number(expectedPrice),
        message: reason,
        status: 'Under Review',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: customerId,
        actionType: 'CREATE',
        entity: 'ResaleRequest',
        entityId: resale.id,
        reason: 'Customer initiated resale request',
      },
    });

    await NotificationService.notifyEmployeesByRole(
      'PM',
      'RESALE_REQUESTED',
      'New Resale Request',
      `A new resale request has been submitted for property ${property.propertyNumber} and awaits review.`,
      property.projectId,
    );

    res.json(resale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit resale request' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        status: true,
        createdAt: true,
      },
    });

    if (!customer) return res.status(404).json({ message: 'Profile not found' });
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { phone, email, address } = req.body;

    // Explicitly stripping everything except permitted editable fields
    const updated = await prisma.customer.update({
      where: { id: req.user!.id },
      data: {
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        status: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actionType: 'UPDATE',
        entity: 'Customer',
        entityId: req.user!.id,
        reason: 'Profile updated by customer',
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;

    const properties = await prisma.property.findMany({
      where: { customerId },
      select: { id: true, project: { select: { name: true } }, propertyNumber: true },
    });
    const propertyIds = properties.map((p) => p.id);

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { referenceType: 'Customer', referenceId: customerId },
          { referenceType: 'Property', referenceId: { in: propertyIds } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Attach human-readable property/project context if it's a property document
    const enrichedDocs = documents.map((doc) => {
      let context = null;
      if (doc.referenceType === 'Property') {
        const prop = properties.find((p) => p.id === doc.referenceId);
        if (prop) {
          context = { project: prop.project.name, property: prop.propertyNumber };
        }
      }
      return { ...doc, context };
    });

    res.json(enrichedDocs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve documents' });
  }
};
