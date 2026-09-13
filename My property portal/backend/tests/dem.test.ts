import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  installment: {
    findUnique: jest.fn(),
  },
  payment: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
}));

describe('DEM Portal API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getCookie = (role: string) => {
    const token = jwt.sign(
      { id: 'dem-user', role, type: 'Employee' },
      process.env.JWT_SECRET || 'super-secret-key',
    );
    return `token=${token}`;
  };

  describe('Payment Ingestion', () => {
    it('should block Customers from accessing DEM routes', async () => {
      const token = jwt.sign(
        { id: 'cust-1', role: 'Customer', type: 'Customer' },
        process.env.JWT_SECRET || 'super-secret-key',
      );
      const res = await request(app)
        .post('/api/v1/dem/payments')
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it('should force verificationStatus to Pending Verification regardless of payload', async () => {
      (prisma.installment.findUnique as jest.Mock).mockResolvedValue({ id: 'inst-1' });
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'pay-1',
        verificationStatus: 'Pending Verification',
      });

      const res = await request(app)
        .post('/api/v1/dem/payments')
        .set('Cookie', getCookie('DEM'))
        .send({
          installmentId: 'inst-1',
          amount: 50000,
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'UTR-12345',
          // Malicious attempt to force approval
          verificationStatus: 'Approved',
        });

      expect(res.status).toBe(200);

      // Verify that the prisma query explicitly set Pending Verification
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          verificationStatus: 'Pending Verification',
        }),
      });

      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
