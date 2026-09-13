import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import * as fmController from '../controllers/fm.controller';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('FM', 'MD'));

router.get('/dashboard', fmController.getDashboard);
// Was registered twice under different path shapes (the /projects/:projectId/...
// variant's projectId was never read by the handler — only :propertyId is used).
router.post('/properties/:propertyId/updates', fmController.createPropertyUpdate);
router.post('/projects/:projectId/construction-updates', fmController.createConstructionUpdate);
router.post('/projects/:projectId/location-updates', fmController.createLocationUpdate);

export default router;
