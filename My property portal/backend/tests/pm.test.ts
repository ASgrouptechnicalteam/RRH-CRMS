import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  assignment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  property: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
}));

describe('PM Routes (Phase 4)', () => {
  const getCookie = () => {
    const token = jwt.sign(
      { id: 'pm-emp-id', role: 'PM', type: 'Employee' },
      process.env.JWT_SECRET || 'super-secret-key',
    );
    return `token=${token}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('PM can access assigned project dashboard', async () => {
    (prisma.assignment.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'a1',
        employeeId: 'pm-emp-id',
        projectId: 'proj-1',
        assignedAt: new Date(),
        project: { id: 'proj-1', properties: [] },
      },
    ]);

    const res = await request(app).get('/api/v1/pm/dashboard').set('Cookie', getCookie());

    expect(res.status).toBe(200);
    expect(res.body.assignedProjects).toBe(1);
    expect(prisma.assignment.findMany).toHaveBeenCalled();
  });

  it('PM cannot access unassigned project details', async () => {
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(null); // Not assigned

    const res = await request(app).get('/api/v1/pm/projects/proj-2').set('Cookie', getCookie());

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not assigned/i);
  });

  it('PM can update property price if assigned', async () => {
    (prisma.property.findUnique as jest.Mock).mockResolvedValue({
      id: 'prop-1',
      projectId: 'proj-1',
      price: 100,
    });
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue({ id: 'a1' });
    (prisma.$transaction as jest.Mock).mockResolvedValue({ id: 'prop-1', price: 200 });

    const res = await request(app)
      .put('/api/v1/pm/properties/prop-1/price')
      .set('Cookie', getCookie())
      .send({ newPrice: 200, reason: 'Market increase' });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(200);
  });
});
