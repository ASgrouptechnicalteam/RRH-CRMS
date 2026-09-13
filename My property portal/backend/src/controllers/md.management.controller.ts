import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';

// --- Employee Management ---
export const getEmployees = async (req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({ include: { role: true } });
  res.json(employees);
};

export const createEmployee = async (req: Request, res: Response) => {
  const { employeeId, name, roleName, password } = req.body;

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return res.status(400).json({ message: 'Invalid role' });

  const passwordHash = await bcrypt.hash(password, 10);

  const employee = await prisma.employee.create({
    data: {
      employeeId,
      name,
      roleId: role.id,
      passwordHash,
    },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.id, actionType: 'CREATE', entity: 'Employee', entityId: employee.id },
  });

  res.json(employee);
};

export const toggleEmployeeStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'Active' or 'Inactive'

  const employee = await prisma.employee.update({
    where: { id: id as string },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      actionType: 'UPDATE',
      entity: 'Employee_Status',
      entityId: employee.id,
      newValue: status,
    },
  });

  res.json(employee);
};

// --- Assignment Management ---
export const assignProject = async (req: Request, res: Response) => {
  const { employeeId, projectId } = req.body;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { role: true },
  });
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  // Rule: FM can only manage one active project
  if (employee.role.name === 'FM') {
    const existing = await prisma.assignment.findFirst({ where: { employeeId } });
    if (existing) {
      return res
        .status(400)
        .json({
          message:
            'FM can only be assigned to one project at a time. Reassign or remove current project first.',
        });
    }
  }

  const assignment = await prisma.assignment.create({
    data: { employeeId, projectId },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      actionType: 'CREATE',
      entity: 'Assignment',
      entityId: assignment.id,
      newValue: `Project: ${projectId}`,
      reason: 'Employee assigned to project',
    },
  });

  res.json(assignment);
};

// --- Companies/Projects/Properties: read-only now (consolidation plan
// Decision 1) — this catalog is synced in from the CRM at booking-
// confirmation time (portal.controller.ts's receiveHandoff), not originated
// here. createCompany/createProject/createProperty were removed along with
// their MD "Add Company/Add Project/Add Property" frontend forms — creating
// a property means creating it in the real CRM, same as any other property.
export const getCompanies = async (req: Request, res: Response) => {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { projects: true } } },
  });
  res.json(companies);
};

export const getProjects = async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    include: { company: true, _count: { select: { properties: true } } },
  });
  res.json(projects);
};

export const getProperties = async (req: Request, res: Response) => {
  const properties = await prisma.property.findMany({ include: { project: true } });
  res.json(properties);
};

// --- Audit ---
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};
