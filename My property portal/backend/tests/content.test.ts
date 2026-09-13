import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  popup: {
    update: jest.fn(),
  },
  carousel: {
    create: jest.fn(),
  },
}));

describe('Content API Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getCookie = (role: string) => {
    const token = jwt.sign(
      { id: 'emp-123', role, type: 'Employee' },
      process.env.JWT_SECRET || 'super-secret-key',
    );
    return `token=${token}`;
  };

  it('should track popup interactions and increment counters', async () => {
    (prisma.popup.update as jest.Mock).mockResolvedValue({ id: 'popup-1' });

    const res = await request(app)
      .post('/api/v1/system/content/popups/popup-1/track')
      .set('Cookie', getCookie('Customer'))
      .send({ eventType: 'viewed' });

    expect(res.status).toBe(200);
    expect(prisma.popup.update).toHaveBeenCalledWith({
      where: { id: 'popup-1' },
      data: { viewedCount: { increment: 1 } },
    });
  });
});
