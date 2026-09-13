import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  payment: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  installment: {
    aggregate: jest.fn(),
  },
}));

describe('Reporting API Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getMDCookie = () => {
    const token = jwt.sign(
      { id: 'md-user', role: 'MD', type: 'Employee' },
      process.env.JWT_SECRET || 'super-secret-key',
    );
    return `token=${token}`;
  };

  describe('Revenue Report Aggregation', () => {
    it('should strictly aggregate only Approved payments', async () => {
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 500000 } });
      (prisma.installment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amountDue: 1000000 },
      });
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/v1/reports/revenue').set('Cookie', getMDCookie());

      expect(res.status).toBe(200);

      // Verify that the aggregation call mathematically enforced verificationStatus = 'Approved'
      expect(prisma.payment.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { verificationStatus: 'Approved' },
        }),
      );

      expect(res.body.totalCollected).toBe(500000);
      expect(res.body.totalExpected).toBe(1000000);
    });
  });
});
