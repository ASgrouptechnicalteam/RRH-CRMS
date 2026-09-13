import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { getResaleQueue, reviewResaleRequest } from '../controllers/resale.controller';

const router = Router();

// Strictly for MD, PM, FM — mirrors payment.routes.ts's verification pattern.
router.use(authenticate, authorizeRoles('MD', 'PM', 'FM'));

router.get('/queue', getResaleQueue);
router.put('/:id/review', reviewResaleRequest);

export default router;
