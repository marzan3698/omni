import { Router } from 'express';
import { leadCallController } from '../controllers/leadCall.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Call routes (must be before /api/leads/:leadId/calls to avoid route conflicts)
// getAllCalls already filters by assigned employee for non-admin users, so no permission required
router.get('/', leadCallController.getAllCalls);
router.get('/upcoming', leadCallController.getUpcomingCalls);

export default router;
