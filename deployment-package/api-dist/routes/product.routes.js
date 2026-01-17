import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';
const router = Router();
router.use(authMiddleware);
router.get('/', verifyPermission('can_manage_products'), productController.getAllProducts);
router.get('/:id', verifyPermission('can_manage_products'), productController.getProductById);
router.post('/', verifyPermission('can_manage_products'), productController.createProduct);
router.put('/:id', verifyPermission('can_manage_products'), productController.updateProduct);
router.delete('/:id', verifyPermission('can_manage_products'), productController.deleteProduct);
router.post('/upload-image', verifyPermission('can_manage_products'), productController.uploadImage);
export default router;
//# sourceMappingURL=product.routes.js.map