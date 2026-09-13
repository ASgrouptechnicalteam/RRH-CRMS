import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  employee: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  assignment: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
}));

describe('MD Portal API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getCookie = (role: string) => {
    const token = jwt.sign(
      { id: '123', role, type: 'Employee' },
      process.env.JWT_SECRET || 'super-secret-key',
    );
    return `token=${token}`;
  };

  describe('Authorization', () => {
    it('should block PM from accessing MD routes', async () => {
      const res = await request(app).get('/api/v1/md/employees').set('Cookie', getCookie('PM'));

      expect(res.status).toBe(403);
    });

    it('should allow MD to access MD routes', async () => {
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/v1/md/employees').set('Cookie', getCookie('MD'));

      expect(res.status).toBe(200);
    });
  });

  describe('Employee Assignments', () => {
    it('should prevent FM from being assigned to multiple projects', async () => {
      // Mock employee as FM
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        role: { name: 'FM' },
      });
      // Mock existing assignment
      (prisma.assignment.findFirst as jest.Mock).mockResolvedValue({
        id: 'assign-1',
        projectId: 'proj-A',
      });

      const res = await request(app)
        .post('/api/v1/md/assignments')
        .set('Cookie', getCookie('MD'))
        .send({ employeeId: 'emp-1', projectId: 'proj-B' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('one project');
    });

    it('should allow PM to be assigned to multiple projects', async () => {
      // Mock employee as PM
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        id: 'emp-2',
        role: { name: 'PM' },
      });

      (prisma.assignment.create as jest.Mock).mockResolvedValue({
        id: 'assign-2',
        projectId: 'proj-B',
      });

      const res = await request(app)
        .post('/api/v1/md/assignments')
        .set('Cookie', getCookie('MD'))
        .send({ employeeId: 'emp-2', projectId: 'proj-B' });

      expect(res.status).toBe(200);
      expect(prisma.assignment.create).toHaveBeenCalled();
    });
  });
});
