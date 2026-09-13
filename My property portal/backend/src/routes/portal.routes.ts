import { Router } from 'express';
import { authenticateCrmServiceToken } from '../middlewares/crmAuth.middleware';
import {
  receiveHandoff,
  receiveKycStatus,
  receivePaymentStatus,
  receiveInstallmentStatus,
} from '../controllers/portal.controller';

const router = Router();

// CRM -> Portal integration surface (consolidation plan Decision 1).
// Every route here is service-to-service only — never a user-facing route.
router.use(authenticateCrmServiceToken);

router.post('/handoff', receiveHandoff);
router.post('/kyc-status', receiveKycStatus);
router.post('/payment-status', receivePaymentStatus);
router.post('/installment-status', receiveInstallmentStatus);

export default router;
