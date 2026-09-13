import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  property: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  eMISchedule: {
    findMany: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  policyAcceptance: {
    findFirst: jest.fn().mockResolvedValue({ id: 'mock-policy-123' }),
  },
}));

describe('Customer Portal API Data Isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getCustomerCookie = (customerId: string) => {
    const token = jwt.sign(
      { id: customerId, role: 'Customer', type: 'Customer' },
      process.env.JWT_SECRET || 'super-secret-key',
    );
    return `token=${token}`;
  };

  describe('Property Data Isolation', () => {
    it('should only fetch properties strictly matching the JWT customer ID', async () => {
      (prisma.property.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/customers/properties')
        .set('Cookie', getCustomerCookie('cust-555'));

      expect(res.status).toBe(200);
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'cust-555' }, // Must exactly match the injected ID
        }),
      );
    });

    it('should reject a property details request if the property belongs to another customer', async () => {
      // Mock returning null (not found for this specific customer ID)
      (prisma.property.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/customers/properties/prop-999')
        .set('Cookie', getCustomerCookie('cust-555'));

      expect(res.status).toBe(404);
      expect(prisma.property.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prop-999', customerId: 'cust-555' }, // Ensures strict binding
        }),
      );
    });
  });

  describe('Financial Ledger Calculation', () => {
    it('should calculate balances strictly based on Approved payments', async () => {
      // Mocking property ownership success
      (prisma.property.findFirst as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        customerId: 'cust-1',
      });

      // Mocking Schedule with Installments and Payments
      (prisma.eMISchedule.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sched-1',
          installments: [
            {
              id: 'inst-1',
              amountDue: 100000,
              payments: [
                { id: 'pay-1', amount: 20000, verificationStatus: 'Pending Verification' }, // Should be ignored
                { id: 'pay-2', amount: 50000, verificationStatus: 'Approved' }, // Should be counted
                { id: 'pay-3', amount: 10000, verificationStatus: 'Rejected' }, // Should be ignored
              ],
            },
          ],
        },
      ]);

      const res = await request(app)
        .get('/api/v1/customers/financials?propertyId=prop-1')
        .set('Cookie', getCustomerCookie('cust-1'));

      expect(res.status).toBe(200);
      const schedule = res.body[0];
      const installment = schedule.installments[0];

      // Only the 50,000 Approved payment should count toward the collected amount
      expect(installment.collectedAmount).toBe(50000);

      // The remaining amount should be 100,000 - 50,000 = 50,000
      expect(installment.remainingAmount).toBe(50000);

      // Verify the outer schedule totals
      expect(schedule.totalScheduleExpected).toBe(100000);
      expect(schedule.totalScheduleCollected).toBe(50000);
      expect(schedule.totalRemaining).toBe(50000);
    });
  });
});
