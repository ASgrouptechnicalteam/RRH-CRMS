import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import * as pmController from '../controllers/pm.controller';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('PM', 'MD')); // MDs typically have inherited access, or just PM

router.get('/dashboard', pmController.getDashboard);
router.get('/projects', pmController.getAssignedProjects);
router.get('/projects/:projectId', pmController.getProjectDetails);
router.put('/properties/:propertyId/price', pmController.updatePropertyPrice);
router.post('/projects/:projectId/updates', pmController.createProjectUpdate);

export default router;
