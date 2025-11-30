import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all campaigns - accessible by users who can view campaigns
router.get('/', campaignController.getAllCampaigns);

// Get active campaigns
router.get('/active', campaignController.getActiveCampaigns);

// Get campaign statistics
router.get('/:id/statistics', campaignController.getCampaignStatistics);

// Get campaign by ID
router.get('/:id', campaignController.getCampaignById);

// Create campaign - SuperAdmin only
router.post(
  '/',
  verifyPermission('can_manage_campaigns'),
  campaignController.createCampaign,
);

// Update campaign - SuperAdmin only
router.put(
  '/:id',
  verifyPermission('can_manage_campaigns'),
  campaignController.updateCampaign,
);

// Delete campaign - SuperAdmin only
router.delete(
  '/:id',
  verifyPermission('can_manage_campaigns'),
  campaignController.deleteCampaign,
);

export default router;

