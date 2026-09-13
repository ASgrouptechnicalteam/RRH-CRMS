import { Router } from 'express';
import {
  getRevenueReport,
  getCompanyComparison,
  getProjectAnalytics,
  getCustomerAnalytics,
  getAuditLogs,
} from '../controllers/report.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Strict reporting access (MDs, and potentially PMs for project specific)
router.use(authenticate, authorizeRoles('MD'));

router.get('/revenue', getRevenueReport);
router.get('/companies', getCompanyComparison);
router.get('/projects', getProjectAnalytics);
router.get('/customers', getCustomerAnalytics);
router.get('/audit-logs', getAuditLogs);

export default router;
