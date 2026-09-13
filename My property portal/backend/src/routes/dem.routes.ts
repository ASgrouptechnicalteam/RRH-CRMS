import { Router } from 'express';
import {
  logExternalPayment,
  uploadPaymentProof,
  getPaymentHistory,
} from '../controllers/dem.payment.controller';
import {
  createAnnouncement,
  ingestCustomer,
  createPropertyUpdate,
} from '../controllers/dem.data.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Enforce DEM access (and MD for oversight)
router.use(authenticate, authorizeRoles('DEM', 'MD'));

// Strict Payment Ingestion
router.post('/payments', logExternalPayment);
router.post('/payments/proof', uploadMiddleware.single('file'), uploadPaymentProof);
router.get('/payments/installment/:installmentId', getPaymentHistory);

// Content & Updates
router.post('/content/announcements', createAnnouncement);
router.post('/updates/property', createPropertyUpdate);

// Data Ingestion
// ingest/booking removed — bookings now arrive via the CRM handoff sync
// (portal.controller.ts's receiveHandoff), not manual DEM entry.
router.post('/ingest/customer', ingestCustomer);

export default router;
