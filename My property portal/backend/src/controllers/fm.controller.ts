import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { NotificationService } from '../services/notification.service';

// Helper to get FM's single assigned project
const getFMAssignedProjectId = async (employeeId: string) => {
  const assignment = await prisma.assignment.findFirst({
    where: { employeeId },
  });
  return assignment?.projectId;
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.id;
    const projectId = await getFMAssignedProjectId(employeeId);

    if (!projectId) {
      return res.json({ assignedProject: null, message: 'You are not assigned to any project.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        properties: true,
      },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    let available = 0;
    let booked = 0;
    let sold = 0;

    project.properties.forEach((prop) => {
      if (prop.status === 'Available') available++;
      else if (prop.status === 'Booked') booked++;
      else if (prop.status === 'Sold' || prop.status === 'Registered') sold++;
    });

    res.json({
      assignedProject: project,
      totalProperties: project.properties.length,
      statusBreakdown: { available, booked, sold },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FM dashboard' });
  }
};

export const createPropertyUpdate = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const { stage, details, mediaUrl } = req.body;
    const employeeId = req.user!.id;

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const assignedProjectId = await getFMAssignedProjectId(employeeId);
    if (assignedProjectId !== property.projectId) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You can only update properties in your assigned project.' });
    }

    const update = await prisma.propertyUpdate.create({
      data: {
        propertyId,
        stage,
        details,
        mediaUrl,
        createdBy: employeeId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: employeeId,
        actionType: 'CREATE',
        entity: 'PropertyUpdate',
        entityId: update.id,
      },
    });

    if (property.customerId) {
      await NotificationService.notifyCustomer(
        property.customerId,
        'PROPERTY_UPDATE',
        'New Property Update',
        `A new update has been posted for your property ${property.propertyNumber}: ${stage}.`,
      );
    }

    res.json(update);
  } catch (error) {
    res.status(500).json({ message: 'Error creating property update' });
  }
};

export const createConstructionUpdate = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const { stage, percentage, remarks, mediaUrl } = req.body;
    const employeeId = req.user!.id;

    const assignedProjectId = await getFMAssignedProjectId(employeeId);
    if (assignedProjectId !== projectId) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You can only update your assigned project.' });
    }

    const update = await prisma.constructionUpdate.create({
      data: {
        projectId,
        stage,
        percentage: Number(percentage),
        remarks,
        mediaUrl,
        createdBy: employeeId,
      },
    });

    res.json(update);
  } catch (error) {
    res.status(500).json({ message: 'Error creating construction update' });
  }
};

export const createLocationUpdate = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const { gps, infrastructure, mediaUrl } = req.body;
    const employeeId = req.user!.id;

    const assignedProjectId = await getFMAssignedProjectId(employeeId);
    if (assignedProjectId !== projectId) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You can only update your assigned project.' });
    }

    const update = await prisma.locationUpdate.create({
      data: {
        projectId,
        gps,
        infrastructure,
        mediaUrl,
        createdBy: employeeId,
      },
    });

    res.json(update);
  } catch (error) {
    res.status(500).json({ message: 'Error creating location update' });
  }
};
