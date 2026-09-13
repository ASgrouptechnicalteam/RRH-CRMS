import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Helper to calculate installment status
const updateInstallmentStatus = async (installmentId: string) => {
  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: { payments: true },
  });

  if (!installment) return;

  const totalApproved = installment.payments
    .filter((p) => p.verificationStatus === 'Approved')
    .reduce((sum, p) => sum + p.amount, 0);

  let newStatus = 'Pending';
  if (totalApproved >= installment.amountDue) {
    newStatus = 'Paid';
  } else if (totalApproved > 0) {
    newStatus = 'Partially Paid';
  } else if (new Date() > installment.dueDate) {
    newStatus = 'Late';
  }

  await prisma.installment.update({
    where: { id: installmentId },
    data: { status: newStatus },
  });
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id as string;
    const { decision, rejectionReason, remarks } = req.body;
    const employeeId = req.user!.id;
    const userRole = req.user!.role;

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Approved or Rejected' });
    }

    if (decision === 'Rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        paymentProof: true,
        installment: {
          include: {
            emiSchedule: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.verificationStatus !== 'Pending Verification') {
      return res.status(400).json({ message: 'Payment is not pending verification' });
    }

    if (payment.paymentProof && payment.paymentProof.uploadedBy === employeeId) {
      return res.status(403).json({ message: 'Forbidden: Cannot verify a payment you entered' });
    }

    const projectId = payment.installment.emiSchedule.property.projectId;

    // Authorization checks
    if (userRole === 'PM' || userRole === 'FM') {
      const assignment = await prisma.assignment.findFirst({
        where: { employeeId, projectId },
      });

      if (!assignment) {
        return res.status(403).json({ message: 'Forbidden: Not authorized for this project' });
      }

      if (userRole === 'FM') {
        const totalAssignments = await prisma.assignment.count({
          where: { employeeId },
        });
        if (totalAssignments !== 1) {
          return res.status(403).json({ message: 'Forbidden: FM assignment rules violated' });
        }
      }
    } else if (userRole !== 'MD') {
      return res.status(403).json({ message: 'Forbidden: Invalid role for verification' });
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: {
          verificationStatus: decision,
          rejectionReason: decision === 'Rejected' ? rejectionReason : null,
        },
      });

      if (payment.paymentProof) {
        await tx.paymentProof.update({
          where: { paymentId },
          data: {
            verifiedBy: employeeId,
            verifiedAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: employeeId,
          actionType: `PAYMENT_${decision.toUpperCase()}`,
          entity: 'Payment',
          entityId: paymentId,
          newValue: JSON.stringify({ decision, rejectionReason, remarks }),
        },
      });

      // Notification to customer
      const customerId = payment.installment.emiSchedule.property.customerId;
      if (customerId) {
        await tx.notification.create({
          data: {
            userId: customerId,
            userType: 'Customer',
            type: `PAYMENT_${decision.toUpperCase()}`,
            title: `Payment ${decision}`,
            message: `Your payment of ${payment.amount} has been ${decision.toLowerCase()}. ${decision === 'Rejected' ? 'Reason: ' + rejectionReason : ''}`,
          },
        });
      }

      return p;
    });

    // Update Installment financial status outside transaction to avoid long lock (or keep it in, but we can do it after)
    if (decision === 'Approved') {
      await updateInstallmentStatus(payment.installmentId);
    }

    res.json(updatedPayment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
};

export const getVerificationQueue = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.id;
    const userRole = req.user!.role;

    let projectIds: string[] = [];

    if (userRole === 'PM' || userRole === 'FM') {
      const assignments = await prisma.assignment.findMany({
        where: { employeeId },
      });
      projectIds = assignments.map((a) => a.projectId);

      if (projectIds.length === 0) {
        return res.json([]);
      }
    }

    const payments = await prisma.payment.findMany({
      where: {
        verificationStatus: 'Pending Verification',
        ...(userRole !== 'MD'
          ? {
              installment: {
                emiSchedule: {
                  property: {
                    projectId: { in: projectIds },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        paymentProof: true,
        installment: {
          include: {
            emiSchedule: {
              include: {
                property: {
                  include: {
                    customer: true,
                    project: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out payments entered by the self
    const filteredPayments = payments.filter(
      (p) => !p.paymentProof || p.paymentProof.uploadedBy !== employeeId,
    );

    res.json(filteredPayments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching verification queue' });
  }
};
