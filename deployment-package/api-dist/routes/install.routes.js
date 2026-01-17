import { Router } from 'express';
import { installController } from '../controllers/install.controller.js';
const router = Router();
// Installation routes - NO authentication required
// These routes should only work if installation is not complete
router.get('/status', installController.checkStatus);
router.post('/check-prerequisites', installController.checkPrerequisites);
router.post('/test-database', installController.testDatabase);
router.post('/setup-database', installController.setupDatabase);
router.post('/create-admin', installController.createAdmin);
router.post('/finalize', installController.finalize);
router.post('/auto-setup', installController.autoSetup);
router.post('/complete-auto', installController.completeAuto);
export default router;
//# sourceMappingURL=install.routes.js.map