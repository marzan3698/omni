import { Router } from 'express';
import { themeController } from '../controllers/theme.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';
import { singleThemeLogo, singleHeroImage, singleHeroVideo, singleHeroAddonImage } from '../middleware/upload.js';

const router = Router();

// Public route for getting theme settings (no auth required)
router.get('/settings', themeController.getThemeSettings);

// Protected routes (require authentication and permission)
router.post('/settings', authMiddleware, verifyPermission('can_manage_root_items'), themeController.updateThemeSettings);
router.post('/logo', authMiddleware, verifyPermission('can_manage_root_items'), singleThemeLogo, themeController.uploadLogo);

// Hero settings routes
// Public route for getting hero settings (no auth required)
router.get('/hero/settings', themeController.getHeroSettings);

// Protected routes for hero settings (require authentication and permission)
router.post('/hero/settings', authMiddleware, verifyPermission('can_manage_root_items'), themeController.updateHeroSettings);
router.post('/hero/image', authMiddleware, verifyPermission('can_manage_root_items'), singleHeroImage, themeController.uploadHeroImage);
router.post('/hero/video', authMiddleware, verifyPermission('can_manage_root_items'), singleHeroVideo, themeController.uploadHeroVideo);
router.post('/hero/addon-image', authMiddleware, verifyPermission('can_manage_root_items'), singleHeroAddonImage, themeController.uploadHeroAddonImage);

// Header settings routes
// Public route for getting header settings (no auth required)
router.get('/header/settings', themeController.getHeaderSettings);

// Protected routes for header settings (require authentication and permission)
router.post('/header/settings', authMiddleware, verifyPermission('can_manage_root_items'), themeController.updateHeaderSettings);
router.post('/header/logo', authMiddleware, verifyPermission('can_manage_root_items'), singleThemeLogo, themeController.uploadHeaderLogo);

// Color settings routes
// Public route for getting color settings (no auth required)
router.get('/colors', themeController.getColorSettings);

// Protected route for color settings (require authentication and permission)
router.post('/colors', authMiddleware, verifyPermission('can_manage_root_items'), themeController.updateColorSettings);

export default router;

