import { Router } from 'express';
import { projectController } from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// All routes require authentication
router.use(authMiddleware);
// Client routes
router.get('/', projectController.getClientProjects);
router.get('/stats', projectController.getClientProjectStats);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.post('/:id/sign', projectController.signProject);
// Admin routes (status update)
router.put('/:id/status', projectController.updateProjectStatus);
export default router;
//# sourceMappingURL=project.routes.js.map