import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  assignment: {
    findFirst: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  property: {
    findUnique: jest.fn(),
  },
}));

describe('FM Routes (Phase 4)', () => {
  const getCookie = () => {
    const token = jwt.sign(
      { id: 'fm-emp-id', role: 'FM', type: 'Employee' },
      process.env.JWT_SECRET || 'super-secret-key',
    );
    return `token=${token}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FM can access dashboard for single assigned project', async () => {
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue({
      id: 'a1',
      employeeId: 'fm-emp-id',
      projectId: 'proj-1',
      assignedAt: new Date(),
    });

    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: 'proj-1',
      properties: [],
    });

    const res = await request(app).get('/api/v1/fm/dashboard').set('Cookie', getCookie());

    expect(res.status).toBe(200);
    expect(res.body.assignedProject.id).toBe('proj-1');
  });

  it('FM cannot create property update for a different project', async () => {
    (prisma.property.findUnique as jest.Mock).mockResolvedValue({
      id: 'prop-1',
      projectId: 'proj-2',
    });
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue({ id: 'a1', projectId: 'proj-1' });

    const res = await request(app)
      .post('/api/v1/fm/properties/prop-1/updates')
      .set('Cookie', getCookie())
      .send({ stage: 'Foundation', details: 'Completed' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/can only update properties in your assigned project/i);
  });

  it('FM cannot access Project B construction updates', async () => {
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue({ id: 'a1', projectId: 'proj-1' });

    const res = await request(app)
      .post('/api/v1/fm/projects/proj-2/construction-updates')
      .set('Cookie', getCookie())
      .send({ stage: 'Structure', percentage: 20 });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/can only update your assigned project/i);
  });
});
