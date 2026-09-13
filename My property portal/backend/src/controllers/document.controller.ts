import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import storageService from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { referenceType, referenceId, documentType, remarks } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { safeFilename, path: destPath } = await storageService.uploadFile(req.file);

    const doc = await prisma.document.create({
      data: {
        referenceType,
        referenceId,
        documentType,
        url: `/api/v1/documents/stream/${safeFilename}`,
        originalFilename: req.file.originalname,
        safeFilename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user!.id,
        verificationStatus: 'Pending Verification',
        remarks,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actionType: 'CREATE',
        entity: 'Document',
        entityId: doc.id,
        newValue: safeFilename,
      },
    });

    if (referenceType === 'Property') {
      const property = await prisma.property.findUnique({ where: { id: referenceId } });
      if (property) {
        await NotificationService.notifyEmployeesByRole(
          'PM',
          'DOCUMENT_SUBMITTED',
          'New Document Submitted',
          `A new document (${documentType}) was submitted for Property ${property.propertyNumber} and awaits verification.`,
          property.projectId,
        );
      }
    }

    res.json(doc);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to upload document' });
  }
};

export const uploadNewVersion = async (req: Request, res: Response) => {
  try {
    const docId = req.params.id as string;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const existingDoc = await prisma.document.findUnique({ where: { id: docId } });
    if (!existingDoc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const { safeFilename, path: destPath } = await storageService.uploadFile(req.file);

    const updatedDoc = await prisma.document.update({
      where: { id: docId },
      data: {
        url: `/api/v1/documents/stream/${safeFilename}`,
        originalFilename: req.file.originalname,
        safeFilename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user!.id,
        verificationStatus: 'Pending Verification',
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actionType: 'UPDATE_VERSION',
        entity: 'Document',
        entityId: updatedDoc.id,
        newValue: safeFilename,
      },
    });

    res.json(updatedDoc);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to update document version' });
  }
};

/**
 * Document verification — previously nonexistent (consolidation plan
 * Decision 1). Uploads set 'Pending Verification' but nothing ever acted on
 * one. Mirrors payment.controller.ts's verify pattern: PM/FM must be
 * assigned to the referenced property's project, MD can act on any, the
 * uploader cannot verify their own submission.
 */
export const getDocumentVerificationQueue = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.id;
    const userRole = req.user!.role;

    const docs = await prisma.document.findMany({
      where: { verificationStatus: 'Pending Verification' },
      orderBy: { createdAt: 'desc' },
    });

    // Property-referenced docs are project-scoped for PM/FM; Customer-referenced
    // docs (KYC etc.) have no project to scope by, so MD-only for those today.
    if (userRole === 'MD') {
      return res.json(docs.filter((d) => d.uploadedBy !== employeeId));
    }

    const assignments = await prisma.assignment.findMany({ where: { employeeId } });
    const projectIds = new Set(assignments.map((a) => a.projectId));
    if (projectIds.size === 0) return res.json([]);

    const propertyDocs = docs.filter(
      (d) => d.referenceType === 'Property' && d.uploadedBy !== employeeId,
    );
    const properties = await prisma.property.findMany({
      where: { id: { in: propertyDocs.map((d) => d.referenceId) } },
      select: { id: true, projectId: true },
    });
    const propertyProjectMap = new Map(properties.map((p) => [p.id, p.projectId]));

    const scoped = propertyDocs.filter((d) =>
      projectIds.has(propertyProjectMap.get(d.referenceId) || ''),
    );
    res.json(scoped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching document verification queue' });
  }
};

export const verifyDocument = async (req: Request, res: Response) => {
  try {
    const docId = req.params.id as string;
    const { decision, remarks } = req.body;
    const employeeId = req.user!.id;
    const userRole = req.user!.role;

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Approved or Rejected' });
    }
    if (decision === 'Rejected' && !remarks) {
      return res.status(400).json({ message: 'A reason is required to reject a document' });
    }

    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.verificationStatus !== 'Pending Verification') {
      return res.status(400).json({ message: 'Document is not pending verification' });
    }
    if (doc.uploadedBy === employeeId) {
      return res.status(403).json({ message: 'Forbidden: Cannot verify a document you uploaded' });
    }

    let notifyCustomerId: string | null = null;
    if (doc.referenceType === 'Property') {
      const property = await prisma.property.findUnique({ where: { id: doc.referenceId } });
      if (!property) return res.status(404).json({ message: 'Referenced property not found' });
      notifyCustomerId = property.customerId;

      if (userRole === 'PM' || userRole === 'FM') {
        const assignment = await prisma.assignment.findFirst({
          where: { employeeId, projectId: property.projectId },
        });
        if (!assignment)
          return res.status(403).json({ message: 'Forbidden: Not authorized for this project' });
        if (userRole === 'FM') {
          const totalAssignments = await prisma.assignment.count({ where: { employeeId } });
          if (totalAssignments !== 1)
            return res.status(403).json({ message: 'Forbidden: FM assignment rules violated' });
        }
      } else if (userRole !== 'MD') {
        return res.status(403).json({ message: 'Forbidden: Invalid role for verification' });
      }
    } else if (userRole !== 'MD') {
      // Customer-referenced documents (e.g. KYC) — MD-only until a real
      // ownership/scoping model for that reference type is designed.
      return res.status(403).json({ message: 'Forbidden: Only MD may verify this document type' });
    } else {
      notifyCustomerId = doc.referenceId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.document.update({
        where: { id: docId },
        data: {
          verificationStatus: decision,
          verifiedBy: employeeId,
          verifiedAt: new Date(),
          remarks: decision === 'Rejected' ? remarks : doc.remarks,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: employeeId,
          actionType: `DOCUMENT_${decision.toUpperCase()}`,
          entity: 'Document',
          entityId: docId,
          newValue: JSON.stringify({ decision, remarks }),
        },
      });

      return result;
    });

    if (notifyCustomerId) {
      await NotificationService.notifyCustomer(
        notifyCustomerId,
        `DOCUMENT_${decision.toUpperCase()}`,
        `Document ${decision}`,
        decision === 'Approved'
          ? `Your ${doc.documentType} document has been verified.`
          : `Your ${doc.documentType} document was rejected. Reason: ${remarks}`,
      );
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying document' });
  }
};

export const streamDocument = async (req: Request, res: Response) => {
  try {
    const safeFilename = req.params.filename as string;
    const userId = req.user!.id;
    const role = req.user!.role;

    // Determine ownership by checking both Document and PaymentProof tables
    const doc = await prisma.document.findFirst({ where: { safeFilename } });
    const paymentProof: any = await prisma.paymentProof.findFirst({
      where: { safeFilename },
      include: {
        payment: {
          include: {
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
        },
      },
    });

    if (!doc && !paymentProof) {
      return res.status(404).json({ message: 'File metadata not found' });
    }

    // Authorization Matrix
    if (role === 'Customer') {
      if (doc) {
        // Must be linked to Customer or Property they own
        if (doc.referenceType === 'Customer' && doc.referenceId !== userId) {
          return res.status(403).json({ message: 'Forbidden' });
        }
        if (doc.referenceType === 'Property') {
          const prop = await prisma.property.findUnique({ where: { id: doc.referenceId } });
          if (prop?.customerId !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
          }
        }
      } else if (paymentProof) {
        const prop = paymentProof.payment.installment.emiSchedule.property;
        if (prop.customerId !== userId) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      }
    } else if (role === 'PM' || role === 'FM') {
      let projectId: string | null = null;
      if (doc && doc.referenceType === 'Property') {
        const prop = await prisma.property.findUnique({ where: { id: doc.referenceId } });
        projectId = prop?.projectId || null;
      } else if (paymentProof) {
        projectId = paymentProof.payment.installment.emiSchedule.property.projectId;
      }

      if (projectId) {
        const assignment = await prisma.assignment.findFirst({
          where: { employeeId: userId, projectId },
        });
        if (!assignment) {
          return res.status(403).json({ message: 'Forbidden: Not assigned to project' });
        }
      }
    }

    const mimeType = doc?.mimeType || paymentProof?.mimeType || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    // Optionally set content-disposition to inline to display in browser
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${doc?.originalFilename || paymentProof?.originalFilename || safeFilename}"`,
    );

    const stream = await storageService.getFileStream(safeFilename);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end();
    });
  } catch (error: any) {
    if (error.message === 'File not found') {
      return res.status(404).json({ message: 'File not found on storage' });
    }
    console.error(error);
    res.status(500).json({ message: 'Failed to stream document' });
  }
};
