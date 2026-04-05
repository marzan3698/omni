import { Router } from 'express';
import { inboxLabelPresetController } from '../controllers/inboxLabelPreset.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Only SuperAdmin (via can_manage_root_items) can manage presets (though employees read them)
router.get('/', inboxLabelPresetController.getAll);
router.post('/', verifyPermission('can_manage_root_items'), inboxLabelPresetController.create);
router.put('/:id', verifyPermission('can_manage_root_items'), inboxLabelPresetController.update);
router.delete('/:id', verifyPermission('can_manage_root_items'), inboxLabelPresetController.delete);

export default router;
