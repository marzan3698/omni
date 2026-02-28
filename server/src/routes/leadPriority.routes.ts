import { Router } from 'express';
import { leadPriorityController } from '../controllers/leadPriority.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', verifyPermission('can_manage_lead_config'), leadPriorityController.create);
router.get('/', verifyPermission('can_view_leads'), leadPriorityController.getAll);
router.get('/:id', verifyPermission('can_view_leads'), leadPriorityController.getById);
router.put('/:id', verifyPermission('can_manage_lead_config'), leadPriorityController.update);
router.delete('/:id', verifyPermission('can_manage_lead_config'), leadPriorityController.delete);

export default router;
