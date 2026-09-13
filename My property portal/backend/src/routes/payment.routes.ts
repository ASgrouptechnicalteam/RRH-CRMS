import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { verifyPayment, getVerificationQueue } from '../controllers/payment.controller';

const router = Router();

// Strictly for MD, PM, FM
router.use(authenticate, authorizeRoles('MD', 'PM', 'FM'));

router.get('/queue', getVerificationQueue);
router.put('/:id/verify', verifyPayment);

export default router;
