import { Router } from 'express';
import { serviceCategoryController } from '../controllers/serviceCategory.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';
import { singleServiceCategoryIcon } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);

router.get('/list', serviceCategoryController.getAllCategoriesForClient);
router.get('/', verifyPermission('can_manage_products'), serviceCategoryController.getAllCategories);
router.post('/', verifyPermission('can_manage_products'), serviceCategoryController.createCategory);
router.get('/:id', verifyPermission('can_manage_products'), serviceCategoryController.getCategoryById);
router.put('/:id', verifyPermission('can_manage_products'), serviceCategoryController.updateCategory);
router.delete('/:id', verifyPermission('can_manage_products'), serviceCategoryController.deleteCategory);
router.post(
  '/:id/upload-icon',
  verifyPermission('can_manage_products'),
  singleServiceCategoryIcon,
  serviceCategoryController.uploadIcon
);

export default router;
