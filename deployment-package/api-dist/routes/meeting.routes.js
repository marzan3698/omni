import { Router } from 'express';
import { leadMeetingController } from '../controllers/leadMeeting.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';
const router = Router();
// All routes require authentication
router.use(authMiddleware);
// Meeting routes (must be before /api/leads/:leadId/meetings to avoid route conflicts)
router.get('/', verifyPermission('can_manage_leads'), leadMeetingController.getAllMeetings);
router.get('/upcoming', leadMeetingController.getUpcomingMeeting);
export default router;
//# sourceMappingURL=meeting.routes.js.map