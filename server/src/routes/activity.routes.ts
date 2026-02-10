import { Router } from 'express';
import { activityController } from '../controllers/activity.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';
import { singleScreenshot } from '../middleware/upload.js';

const router = Router();

router.post('/log', authMiddleware, activityController.log);
router.post(
  '/screenshot',
  authMiddleware,
  singleScreenshot,
  activityController.uploadScreenshot
);

router.get(
  '/employees',
  authMiddleware,
  verifyPermission('can_manage_root_items'),
  activityController.getEmployeeSummaries
);
router.get(
  '/employee/:userId',
  authMiddleware,
  verifyPermission('can_manage_root_items'),
  activityController.getEmployeeDetail
);
router.get(
  '/employee/:userId/screenshots',
  authMiddleware,
  verifyPermission('can_manage_root_items'),
  activityController.getEmployeeScreenshots
);

export default router;
