import { Router } from 'express';
import { leadMeetingController } from '../controllers/leadMeeting.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Meeting routes (role-based filtering in service: assigned only for non-admin, all for managers)
router.get('/', leadMeetingController.getAllMeetings);
router.get('/upcoming', leadMeetingController.getUpcomingMeeting);

export default router;
