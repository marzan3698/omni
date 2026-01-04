import { Router } from 'express';
import { themeController } from '../controllers/theme.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';
import { singleThemeLogo } from '../middleware/upload.js';

const router = Router();

// Public route for getting theme settings (no auth required)
router.get('/settings', themeController.getThemeSettings);

// Protected routes (require authentication and permission)
router.post('/settings', authMiddleware, verifyPermission('can_manage_root_items'), themeController.updateThemeSettings);
router.post('/logo', authMiddleware, verifyPermission('can_manage_root_items'), singleThemeLogo, themeController.uploadLogo);

export default router;

