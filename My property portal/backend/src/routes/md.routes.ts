import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/md.dashboard.controller';
import { getCustomer360, getCustomersList } from '../controllers/md.customer.controller';
import {
  getEmployees,
  createEmployee,
  toggleEmployeeStatus,
  assignProject,
  getCompanies,
  getProjects,
  getProperties,
  getAuditLogs,
} from '../controllers/md.management.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { resetPassword } from '../controllers/auth.controller'; // Reusing from Phase 2

const router = Router();

// Enforce MD-only access for all routes in this file
router.use(authenticate, authorizeRoles('MD'));

// Dashboard
router.get('/dashboard', getDashboardMetrics);

// Management
// Companies/Projects/Properties are read-only here — see the comment on
// md.management.controller.ts. They're synced in from the CRM now, not
// created in the portal.
router.get('/companies', getCompanies);
router.get('/projects', getProjects);
router.get('/properties', getProperties);
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id/status', toggleEmployeeStatus);
router.post('/employees/reset-password', resetPassword);

// Audit
router.get('/audit-logs', getAuditLogs);

// Assignments
router.post('/assignments', assignProject);

// Customer
router.get('/customers', getCustomersList);
router.get('/customers/:id/360', getCustomer360);

export default router;
