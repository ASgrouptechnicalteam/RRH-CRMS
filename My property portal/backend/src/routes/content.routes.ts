import { Router } from 'express';
import {
  createContentDraft,
  submitForVerification,
  verifyContent,
  getActiveContent,
  getEmployeeContent,
  trackPopupInteraction,
} from '../controllers/content.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

// Content Management (Employees Only)
router.get('/content/employee', authorizeRoles('DEM', 'MD', 'PM'), getEmployeeContent);
router.post('/content/draft', authorizeRoles('DEM', 'MD', 'PM'), createContentDraft);
router.post('/content/submit', authorizeRoles('DEM', 'MD', 'PM'), submitForVerification);
router.post('/content/verify', authorizeRoles('MD', 'PM'), verifyContent);

// Content Viewing (Customers & Employees)
router.get('/content/active', getActiveContent);
router.post('/content/popups/:id/track', trackPopupInteraction);

// Notifications (Everyone)
router.get('/notifications', getMyNotifications);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/read-all', markAllAsRead);

export default router;
