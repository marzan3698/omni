import { Router } from 'express';
import { leadLabelController } from '../controllers/leadLabel.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', verifyPermission('can_manage_lead_config'), leadLabelController.create);
router.get('/', verifyPermission('can_view_leads'), leadLabelController.getAll);
router.get('/:id', verifyPermission('can_view_leads'), leadLabelController.getById);
router.put('/:id', verifyPermission('can_manage_lead_config'), leadLabelController.update);
router.delete('/:id', verifyPermission('can_manage_lead_config'), leadLabelController.delete);

export default router;
