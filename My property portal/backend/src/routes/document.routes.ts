import { Router } from 'express';
import {
  uploadDocument,
  uploadNewVersion,
  streamDocument,
  getDocumentVerificationQueue,
  verifyDocument,
} from '../controllers/document.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

// Documents stream
router.get('/stream/:filename', streamDocument);

// Document uploads
router.post('/upload', uploadMiddleware.single('file'), uploadDocument);
router.post('/:id/versions', uploadMiddleware.single('file'), uploadNewVersion);

// Document verification — MD, PM, FM only (mirrors payment verification).
router.get('/verification-queue', authorizeRoles('MD', 'PM', 'FM'), getDocumentVerificationQueue);
router.put('/:id/verify', authorizeRoles('MD', 'PM', 'FM'), verifyDocument);

export default router;
