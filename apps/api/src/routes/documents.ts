import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { requireAuthz } from '../middleware/authz';
import { validateRequestBody } from '../middleware/validate';
import {
  DocumentUploadSchema,
  DocumentVerifySchema,
  DocumentArchiveSchema,
  Permissions,
} from '@rrh-ems/shared';
import { DocumentService } from '../services/document.service';
import { DocumentGenerationService } from '../services/document-generation.service';
import multer from 'multer';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, JPG, JPEG, PNG, and WEBP files are allowed.'));
  },
});

router.get(
  '/',
  authenticateToken,
  requirePermission([Permissions.DOCUMENTS_READ]),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const filters = {
        customer_id: req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined,
        lead_id: req.query.lead_id ? parseInt(req.query.lead_id as string, 10) : undefined,
        opportunity_id: req.query.opportunity_id ? parseInt(req.query.opportunity_id as string, 10) : undefined,
        booking_id: req.query.booking_id ? parseInt(req.query.booking_id as string, 10) : undefined,
        property_id: req.query.property_id ? parseInt(req.query.property_id as string, 10) : undefined,
        project_id: req.query.project_id ? parseInt(req.query.project_id as string, 10) : undefined,
        payment_id: req.query.payment_id ? parseInt(req.query.payment_id as string, 10) : undefined,
        document_type: req.query.document_type as string | undefined,
        status: req.query.status as string | undefined,
        verification_status: req.query.verification_status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };
      const result = await DocumentService.listDocuments(req.user!, filters);
      return res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  authenticateToken,
  requirePermission([Permissions.DOCUMENTS_READ]),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const doc = await DocumentService.getDocument(req.user!, id);
      return res.status(200).json({ document: doc });
    } catch (error: any) {
      next(error);
    }
  }
);

router.post(
  '/',
  authenticateToken,
  requirePermission([Permissions.DOCUMENTS_CREATE]),
  (req: AuthenticatedRequest, res: Response, next: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum of 10MB' });
        }
        return res.status(400).json({ error: 'File upload failed' });
      }
      next();
    });
  },
  validateRequestBody(DocumentUploadSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      const doc = await DocumentService.uploadDocument(req.user!, req.file, req.body);
      return res.status(201).json({ message: 'Document uploaded successfully.', document: doc });
    } catch (error: any) {
      next(error);
    }
  }
);

router.post(
  '/generate-agreement',
  authenticateToken,
  requirePermission([Permissions.DOCUMENTS_CREATE]),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { booking_id } = req.body;
      if (!booking_id) {
        return res.status(400).json({ error: 'booking_id is required' });
      }
      
      const doc = await DocumentGenerationService.generateAgreement(req.user!, parseInt(booking_id, 10));
      return res.status(201).json({ message: 'Agreement generated successfully.', document: doc });
    } catch (error: any) {
      next(error);
    }
  }
);

router.get(
  '/:id/download',
  authenticateToken,
  requirePermission([Permissions.DOCUMENTS_READ]),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { fileBuffer, document: doc } = await DocumentService.downloadDocument(req.user!, id);
      res.setHeader('Content-Type', doc.mime_type);
      res.setHeader('Content-Disposition', 'attachment; filename="' + doc.original_name.replace(/[^a-zA-Z0-9._-]/g, '_') + '"');
      return res.send(Buffer.from(fileBuffer));
    } catch (error: any) {
      next(error);
    }
  }
);

router.patch(
  '/:id/verify',
  authenticateToken,
  requirePermission([Permissions.DOCUMENTS_VERIFY]),
  validateRequestBody(DocumentVerifySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, notes } = req.body;
      const doc = await DocumentService.verifyDocument(req.user!, id, status, notes);
      return res.status(200).json({ message: 'Document ' + status.toLowerCase() + '.', document: doc });
    } catch (error: any) {
      next(error);
    }
  }
);

router.patch(
  '/:id/archive',
  authenticateToken,
  requirePermission([Permissions.DOCUMENTS_DELETE]),
  validateRequestBody(DocumentArchiveSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { reason } = req.body;
      const doc = await DocumentService.archiveDocument(req.user!, id, reason);
      return res.status(200).json({ message: 'Document archived.', document: doc });
    } catch (error: any) {
      next(error);
    }
  }
);

router.patch(
  '/:id/restore',
  authenticateToken,
  requirePermission([Permissions.DOCUMENTS_DELETE]),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const doc = await DocumentService.restoreDocument(req.user!, id);
      return res.status(200).json({ message: 'Document restored.', document: doc });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
