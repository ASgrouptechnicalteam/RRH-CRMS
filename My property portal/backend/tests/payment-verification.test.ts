import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/jwt');
jest.mock('../src/utils/prisma', () => ({
  payment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  paymentProof: {
    update: jest.fn(),
  },
  assignment: {
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  installment: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

describe('Payment Verification Engine (Phase 5 Extension)', () => {
  const getCookie = (role: string, id: string = 'user-123') => {
    const token = jwt.sign(
      { id, role, type: role === 'Customer' ? 'Customer' : 'Employee' },
      process.env.JWT_SECRET || 'secret',
    );
    return `token=${token}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const jwtMock = require('../src/utils/jwt');
    jwtMock.verifyToken = jest.fn((token: string) => jwt.decode(token));
  });

  const mockPayment = (overrides = {}) => ({
    id: 'pay-1',
    amount: 1000,
    verificationStatus: 'Pending Verification',
    installmentId: 'inst-1',
    paymentProof: {
      uploadedBy: 'dem-123',
    },
    installment: {
      id: 'inst-1',
      amountDue: 1000,
      dueDate: new Date(),
      emiSchedule: {
        property: {
          projectId: 'proj-1',
          customerId: 'cust-1',
        },
      },
      payments: [
        { verificationStatus: 'Approved', amount: 0 }, // Mock existing approved amounts
      ],
    },
    ...overrides,
  });

  // 1 & 2: DEM creates payment (Tested implicitly or in dem.payment.controller)

  it('3. DEM cannot approve own payment', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());

    // Attempting to verify with the same ID as uploadedBy
    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('PM', 'dem-123')) // Even if they have PM role, they uploaded it
      .send({ decision: 'Approved' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot verify a payment you entered/i);
  });

  it('4. Customer cannot approve', async () => {
    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('Customer', 'cust-1'))
      .send({ decision: 'Approved' });

    expect(res.status).toBe(403); // Middleware block
  });

  it('5. PM can approve assigned-project payment', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue({ id: 'assign-1' }); // Assigned
    (prisma.payment.update as jest.Mock).mockResolvedValue({ verificationStatus: 'Approved' });
    (prisma.installment.findUnique as jest.Mock).mockResolvedValue(mockPayment().installment);

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('PM', 'pm-1'))
      .send({ decision: 'Approved' });

    expect(res.status).toBe(200);
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ verificationStatus: 'Approved' }),
      }),
    );
  });

  it('6. PM cannot approve unassigned-project payment', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(null); // Not Assigned

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('PM', 'pm-1'))
      .send({ decision: 'Approved' });

    expect(res.status).toBe(403);
  });

  it('7. FM can approve authorized assigned-project payment', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue({ id: 'assign-1' }); // Assigned
    (prisma.assignment.count as jest.Mock).mockResolvedValue(1); // FM Rule: exactly 1
    (prisma.payment.update as jest.Mock).mockResolvedValue({ verificationStatus: 'Approved' });
    (prisma.installment.findUnique as jest.Mock).mockResolvedValue(mockPayment().installment);

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('FM', 'fm-1'))
      .send({ decision: 'Approved' });

    expect(res.status).toBe(200);
  });

  it('8. FM cannot access another project', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(null); // Not Assigned

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('FM', 'fm-1'))
      .send({ decision: 'Approved' });

    expect(res.status).toBe(403);
  });

  it('9. Rejection requires reason', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('MD', 'md-1')) // MD has access to all
      .send({ decision: 'Rejected' }); // Missing reason

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reason is required/i);
  });

  it('10. Rejected payment does not affect balance', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());
    (prisma.payment.update as jest.Mock).mockResolvedValue({ verificationStatus: 'Rejected' });

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('MD', 'md-1'))
      .send({ decision: 'Rejected', rejectionReason: 'Blurry image' });

    expect(res.status).toBe(200);
    // Installment update should NOT be called on reject
    expect(prisma.installment.update).not.toHaveBeenCalled();
  });

  it('11. Approved payment affects balance', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());
    (prisma.payment.update as jest.Mock).mockResolvedValue({ verificationStatus: 'Approved' });

    const installmentMock = mockPayment().installment;
    installmentMock.payments = [
      { verificationStatus: 'Approved', amount: 1000 } as any, // The newly approved sum
    ];
    (prisma.installment.findUnique as jest.Mock).mockResolvedValue(installmentMock);

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('MD', 'md-1'))
      .send({ decision: 'Approved' });

    expect(res.status).toBe(200);
    expect(prisma.installment.update).toHaveBeenCalledWith({
      where: { id: 'inst-1' },
      data: { status: 'Paid' }, // Since sum(1000) >= amountDue(1000)
    });
  });

  it('12. Partial payment works', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());
    (prisma.payment.update as jest.Mock).mockResolvedValue({ verificationStatus: 'Approved' });

    const installmentMock = mockPayment().installment;
    installmentMock.payments = [
      { verificationStatus: 'Approved', amount: 500 } as any, // Partial sum
    ];
    (prisma.installment.findUnique as jest.Mock).mockResolvedValue(installmentMock);

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('MD', 'md-1'))
      .send({ decision: 'Approved' });

    expect(res.status).toBe(200);
    expect(prisma.installment.update).toHaveBeenCalledWith({
      where: { id: 'inst-1' },
      data: { status: 'Partially Paid' }, // sum(500) < amountDue(1000)
    });
  });

  it('14 & 15. Audit log and Notification created on approval', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment());
    (prisma.payment.update as jest.Mock).mockResolvedValue({ verificationStatus: 'Approved' });
    (prisma.installment.findUnique as jest.Mock).mockResolvedValue(mockPayment().installment);

    const res = await request(app)
      .put('/api/v1/payments/pay-1/verify')
      .set('Cookie', getCookie('MD', 'md-1'))
      .send({ decision: 'Approved' });

    expect(res.status).toBe(200);
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});
