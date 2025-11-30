import { Router } from 'express';
import { productCategoryController } from '../controllers/productCategory.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', verifyPermission('can_manage_products'), productCategoryController.getAllCategories);
router.get('/:id', verifyPermission('can_manage_products'), productCategoryController.getCategoryById);
router.post('/', verifyPermission('can_manage_products'), productCategoryController.createCategory);
router.put('/:id', verifyPermission('can_manage_products'), productCategoryController.updateCategory);
router.delete('/:id', verifyPermission('can_manage_products'), productCategoryController.deleteCategory);

export default router;

