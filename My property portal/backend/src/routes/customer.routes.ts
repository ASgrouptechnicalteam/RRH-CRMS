import { Router } from 'express';
import {
  getDashboard,
  getMyProperties,
  getPropertyDetails,
  getFinancials,
  requestResale,
  getProfile,
  updateProfile,
  getDocuments,
} from '../controllers/customer.controller';
import {
  authenticate,
  authorizeRoles,
  requirePolicyAcceptance,
} from '../middlewares/auth.middleware';

const router = Router();

// Strict Customer Enforcement & Policy Check
router.use(authenticate, authorizeRoles('Customer'), requirePolicyAcceptance);

router.get('/dashboard', getDashboard);
router.get('/properties', getMyProperties);
router.get('/properties/:id', getPropertyDetails);
router.get('/financials', getFinancials);

router.post('/resale', requestResale);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.get('/documents', getDocuments);

export default router;
