import { Router } from 'express';
import { leadCategoryController } from '../controllers/leadCategory.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware); // All routes require authentication

router.post('/', verifyPermission('can_manage_lead_config'), leadCategoryController.createCategory);
router.get('/', verifyPermission('can_view_leads'), leadCategoryController.getCategories);
router.get('/:id', verifyPermission('can_view_leads'), leadCategoryController.getCategoryById);
router.put('/:id', verifyPermission('can_manage_lead_config'), leadCategoryController.updateCategory);
router.delete('/:id', verifyPermission('can_manage_lead_config'), leadCategoryController.deleteCategory);

export default router;

