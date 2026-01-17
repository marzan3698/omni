import { Router } from 'express';
import { systemSettingController } from '../controllers/systemSetting.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';
const router = Router();
router.use(authMiddleware); // All routes require authentication
router.post('/', verifyPermission('can_manage_root_items'), systemSettingController.upsertSetting);
router.get('/', verifyPermission('can_manage_root_items'), systemSettingController.getSettings);
router.get('/:key', verifyPermission('can_manage_root_items'), systemSettingController.getSettingByKey);
router.put('/:key', verifyPermission('can_manage_root_items'), systemSettingController.updateSetting);
router.delete('/:key', verifyPermission('can_manage_root_items'), systemSettingController.deleteSetting);
export default router;
//# sourceMappingURL=systemSetting.routes.js.map