import { Router } from 'express';
import { paymentGatewayController } from '../controllers/paymentGateway.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';
const router = Router();
// All routes require authentication
router.use(authMiddleware);
// Get all payment gateways
router.get('/', paymentGatewayController.getAll);
// Get active payment gateways (for clients) - no permission check, clients need this
router.get('/active', paymentGatewayController.getActive);
// Get payment gateway by ID
router.get('/:id', paymentGatewayController.getById);
// Create payment gateway - requires permission
router.post('/', verifyPermission('can_manage_payment_settings'), paymentGatewayController.create);
// Update payment gateway - requires permission
router.put('/:id', verifyPermission('can_manage_payment_settings'), paymentGatewayController.update);
// Delete payment gateway - requires permission
router.delete('/:id', verifyPermission('can_manage_payment_settings'), paymentGatewayController.delete);
export default router;
//# sourceMappingURL=paymentGateway.routes.js.map