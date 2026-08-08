import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequestBody } from '../middleware/validate';
import { TaskCreateSchema, TaskUpdateStatusSchema, Roles } from '@rrh-ems/shared';
import { notifyEmployee } from '../utils/notifyEmployee';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// GET /api/v1/tasks/all-team-tasks - MD & Management View of All Employee Tasks
router.get('/all-team-tasks', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user!.roles;
    if (!roles.includes(Roles.MD) && !roles.includes(Roles.MARKETING_DIRECTOR) && !roles.includes(Roles.ADMIN) && !roles.includes(Roles.HR_MANAGER)) {
      return res.status(403).json({ error: 'Access denied: Management permission required.' });
    }

    const now = new Date();

    // Auto-flip past target date tasks to OVERDUE & send alerts to MD & Dept Head
    const newlyOverdue = await p.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        target_date: { lt: now },
      },
      include: { assignee: true },
    });

    for (const t of newlyOverdue) {
      await p.task.update({
        where: { id: t.id },
        data: { status: 'OVERDUE' },
      });

      // Send alert to MD / System Admin & Assignee
      const mdEmp = await p.employee.findFirst({
        where: { roles: { some: { role: { name: Roles.MD } } } },
      });

      if (mdEmp) {
        await p.notification.create({
          data: {
            employee_id: mdEmp.id,
            title: '🚨 OVERDUE TASK ALERT',
            message: `Task "${t.title}" assigned to ${t.assignee?.employee_code || 'staff'} is past deadline! Please contact employee to clarify.`,
            type: 'TASK_OVERDUE',
          },
        });
      }
    }

    const allTasks = await p.task.findMany({
      include: { assignee: true },
      orderBy: [{ target_date: 'asc' }],
    });

    return res.status(200).json({ tasks: allTasks });
  } catch (error) {
    console.error('Fetch all team tasks error:', error);
    return res.status(500).json({ error: 'Failed to fetch team tasks' });
  }
});

// GET /api/v1/tasks/my-tasks - List assigned tasks with auto-overdue check
router.get('/my-tasks', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.employeeId;
    const now = new Date();

    // Auto-flip tasks to OVERDUE if past target_date
    await p.task.updateMany({
      where: {
        assignee_id: employeeId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        target_date: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    const tasks = await p.task.findMany({
      where: { assignee_id: employeeId },
      orderBy: [{ target_date: 'asc' }],
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/v1/tasks - Create new task
router.post('/', authenticateToken, validateRequestBody(TaskCreateSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, assignee_id, priority, deadline } = req.body;
    const creatorId = req.user!.employeeId;

    const task = await p.task.create({
      data: {
        title,
        description,
        assignee_id,
        created_by: creatorId,
        status: 'PENDING',
        target_date: deadline ? new Date(deadline) : new Date(Date.now() + 86400000),
      },
    });

    // Notify assignee via universal notifier (in-app + push)
    await notifyEmployee(assignee_id, {
      type: 'TASK_ASSIGNED',
      title: '📋 New Task Assigned to You',
      message: `Task "${title}" has been assigned to you. Deadline: ${new Date(task.target_date).toLocaleDateString('en-IN')}.`,
      link: '/tasks',
    });

    return res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/v1/tasks/:id/status - Update Task Status & Cheer-up Event
router.patch('/:id/status', authenticateToken, validateRequestBody(TaskUpdateStatusSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const employeeId = req.user!.employeeId;

    const existingTask = await p.task.findUnique({
      where: { id: taskId },
    });

    const isManagement = req.user!.roles.some((r) =>
      [Roles.MD, Roles.ADMIN, Roles.HR_MANAGER, Roles.MARKETING_DIRECTOR].includes(r as any)
    );

    if (!existingTask || (!isManagement && existingTask.assignee_id !== employeeId)) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const isCompleting = status === 'COMPLETED' && existingTask.status !== 'COMPLETED';

    const updatedTask = await p.task.update({
      where: { id: taskId },
      data: {
        status,
        completed_at: isCompleting ? new Date() : existingTask.completed_at,
      },
    });

    if (isCompleting) {
      await p.auditEvent.create({
        data: {
          actor_id: employeeId,
          action: 'TASK_COMPLETED',
          entity_type: 'TASK',
          entity_id: taskId,
          new_value: JSON.stringify({ points: 1.0, taskTitle: updatedTask.title }),
        },
      });

      await p.notification.create({
        data: {
          employee_id: employeeId,
          title: '🎉 Task Completed!',
          message: `Great job! You completed "${updatedTask.title}" and earned +1.0 performance points!`,
          type: 'SYSTEM_ALERT',
        },
      });
    }

    return res.status(200).json({
      message: `Task status updated to ${status}`,
      task: updatedTask,
      cheerUp: isCompleting,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update task status' });
  }
});

export default router;
