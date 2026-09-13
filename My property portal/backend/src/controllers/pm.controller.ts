import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Helper to check assignment
const verifyPMAssignment = async (employeeId: string, projectId: string) => {
  const assignment = await prisma.assignment.findFirst({
    where: { employeeId, projectId },
  });
  return !!assignment;
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.id;

    // Get assigned projects
    const assignments = await prisma.assignment.findMany({
      where: { employeeId },
      include: {
        project: {
          include: {
            properties: true,
          },
        },
      },
    });

    const assignedProjects = assignments.map((a) => a.project);

    let totalProperties = 0;
    let available = 0;
    let booked = 0;
    let sold = 0;

    assignedProjects.forEach((project) => {
      totalProperties += project.properties.length;
      project.properties.forEach((prop) => {
        if (prop.status === 'Available') available++;
        else if (prop.status === 'Booked') booked++;
        else if (prop.status === 'Sold' || prop.status === 'Registered') sold++;
      });
    });

    res.json({
      assignedProjects: assignedProjects.length,
      totalProperties,
      statusBreakdown: { available, booked, sold },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching PM dashboard' });
  }
};

export const getAssignedProjects = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.id;

    const assignments = await prisma.assignment.findMany({
      where: { employeeId },
      include: {
        project: {
          include: {
            _count: {
              select: { properties: true },
            },
          },
        },
      },
    });

    res.json(assignments.map((a) => a.project));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assigned projects' });
  }
};

export const getProjectDetails = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const employeeId = req.user!.id;

    if (!(await verifyPMAssignment(employeeId, projectId))) {
      return res.status(403).json({ message: 'Forbidden: You are not assigned to this project' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        properties: true,
        projectUpdates: { orderBy: { createdAt: 'desc' } },
        constructionUpdates: { orderBy: { createdAt: 'desc' } },
      },
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project details' });
  }
};

export const updatePropertyPrice = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const { newPrice, reason } = req.body;
    const employeeId = req.user!.id;

    // First find property to check project assignment
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (!(await verifyPMAssignment(employeeId, property.projectId))) {
      return res
        .status(403)
        .json({ message: "Forbidden: Not assigned to this property's project" });
    }

    const updatedProperty = await prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id: propertyId },
        data: { price: newPrice },
      });

      await tx.marketValueHistory.create({
        data: {
          propertyId,
          value: newPrice,
          reason,
          updatedBy: employeeId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: employeeId,
          actionType: 'UPDATE_PRICE',
          entity: 'Property',
          entityId: propertyId,
          oldValue: property.price.toString(),
          newValue: newPrice.toString(),
          reason,
        },
      });

      return updated;
    });

    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: 'Error updating property price' });
  }
};

export const createProjectUpdate = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const { content, mediaUrl } = req.body;
    const employeeId = req.user!.id;

    if (!(await verifyPMAssignment(employeeId, projectId))) {
      return res.status(403).json({ message: 'Forbidden: Not assigned to this project' });
    }

    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        content,
        mediaUrl,
        createdBy: employeeId,
      },
    });

    res.json(update);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project update' });
  }
};
