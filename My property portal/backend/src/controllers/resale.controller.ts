import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { NotificationService } from '../services/notification.service';

/**
 * Resale approval — previously nonexistent (consolidation plan Decision 1).
 * A customer could file a ResaleRequest (customer.controller.ts) but nothing
 * ever acted on one. Mirrors payment.controller.ts's verify pattern exactly:
 * PM/FM must be assigned to the property's project, MD can act on any.
 */

export const getResaleQueue = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.id;
    const userRole = req.user!.role;

    let projectIds: string[] = [];
    if (userRole === 'PM' || userRole === 'FM') {
      const assignments = await prisma.assignment.findMany({ where: { employeeId } });
      projectIds = assignments.map((a) => a.projectId);
      if (projectIds.length === 0) return res.json([]);
    }

    const requests = await prisma.resaleRequest.findMany({
      where: {
        status: 'Under Review',
        ...(userRole !== 'MD' ? { property: { projectId: { in: projectIds } } } : {}),
      },
      include: { property: { include: { customer: true, project: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching resale queue' });
  }
};

export const reviewResaleRequest = async (req: Request, res: Response) => {
  try {
    const resaleId = req.params.id as string;
    const { decision, message } = req.body;
    const employeeId = req.user!.id;
    const userRole = req.user!.role;

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Approved or Rejected' });
    }
    if (decision === 'Rejected' && !message) {
      return res.status(400).json({ message: 'A reason is required to reject a resale request' });
    }

    const resale = await prisma.resaleRequest.findUnique({
      where: { id: resaleId },
      include: { property: { include: { customer: true } } },
    });
    if (!resale) return res.status(404).json({ message: 'Resale request not found' });
    if (resale.status !== 'Under Review') {
      return res.status(400).json({ message: 'Resale request is not pending review' });
    }

    if (userRole === 'PM' || userRole === 'FM') {
      const assignment = await prisma.assignment.findFirst({
        where: { employeeId, projectId: resale.property.projectId },
      });
      if (!assignment) {
        return res.status(403).json({ message: 'Forbidden: Not authorized for this project' });
      }
      if (userRole === 'FM') {
        const totalAssignments = await prisma.assignment.count({ where: { employeeId } });
        if (totalAssignments !== 1) {
          return res.status(403).json({ message: 'Forbidden: FM assignment rules violated' });
        }
      }
    } else if (userRole !== 'MD') {
      return res.status(403).json({ message: 'Forbidden: Invalid role for review' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const newStatus = decision === 'Approved' ? 'Approved' : 'Rejected';
      const updatedResale = await tx.resaleRequest.update({
        where: { id: resaleId },
        data: {
          status: newStatus,
          message: message ?? resale.message,
          reviewedBy: employeeId,
          reviewedAt: new Date(),
        },
      });

      // Approving a resale puts the property back on the market — it's no
      // longer this customer's active unit. Rejecting leaves everything as-is.
      if (decision === 'Approved') {
        await tx.property.update({
          where: { id: resale.propertyId },
          data: { status: 'Resale' },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: employeeId,
          actionType: `RESALE_${decision.toUpperCase()}`,
          entity: 'ResaleRequest',
          entityId: resaleId,
          newValue: JSON.stringify({ decision, message }),
        },
      });

      return updatedResale;
    });

    if (resale.property.customerId) {
      await NotificationService.notifyCustomer(
        resale.property.customerId,
        `RESALE_${decision.toUpperCase()}`,
        `Resale Request ${decision}`,
        decision === 'Approved'
          ? `Your resale request for ${resale.property.propertyNumber} has been approved. Our team will list it for resale.`
          : `Your resale request for ${resale.property.propertyNumber} was not approved. Reason: ${message}`,
      );
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error reviewing resale request' });
  }
};
