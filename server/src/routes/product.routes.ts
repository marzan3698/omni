import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { authMiddleware, verifyPermission, verifyPermissionAny } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// List products - accessible to all authenticated users (for lead creation, inbox, etc.)
router.get('/list', productController.getAllProducts);

// Management routes - allow can_manage_products or can_view_products (for invoice creation)
router.get('/', verifyPermissionAny(['can_manage_products', 'can_view_products']), productController.getAllProducts);
router.get('/:id', verifyPermissionAny(['can_manage_products', 'can_view_products']), productController.getProductById);
router.post('/', verifyPermission('can_manage_products'), productController.createProduct);
router.put('/:id', verifyPermission('can_manage_products'), productController.updateProduct);
router.delete('/:id', verifyPermission('can_manage_products'), productController.deleteProduct);
router.post('/upload-image', verifyPermission('can_manage_products'), productController.uploadImage);

export default router;

