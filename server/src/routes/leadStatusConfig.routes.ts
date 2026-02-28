import { Router } from 'express';
import { leadStatusConfigController } from '../controllers/leadStatusConfig.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', verifyPermission('can_manage_lead_config'), leadStatusConfigController.create);
router.get('/', verifyPermission('can_view_leads'), leadStatusConfigController.getAll);
router.get('/:id', verifyPermission('can_view_leads'), leadStatusConfigController.getById);
router.put('/:id', verifyPermission('can_manage_lead_config'), leadStatusConfigController.update);
router.delete('/:id', verifyPermission('can_manage_lead_config'), leadStatusConfigController.delete);

export default router;
