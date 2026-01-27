import { Router } from 'express';
import { inboxReportController } from '../controllers/inbox-report.controller.js';
import { authMiddleware, verifyRole } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication and SuperAdmin role
router.use(authMiddleware);
router.use(verifyRole(['SuperAdmin']));

router.get('/', inboxReportController.getInboxReport);

export default router;
