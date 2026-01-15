import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { leadMeetingController } from '../controllers/leadMeeting.controller.js';
import { leadCallController } from '../controllers/leadCall.controller.js';
import { authMiddleware, verifyPermission, verifyLeadAccess } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Lead routes
router.get('/', verifyPermission('can_manage_leads'), leadController.getAllLeads);
router.get('/pipeline', verifyPermission('can_manage_leads'), leadController.getLeadPipeline);
router.get('/client', leadController.getClientLeads); // Client route - no permission check needed, handled in service
router.get('/:id', verifyLeadAccess, leadController.getLeadById);
router.post('/', verifyPermission('can_manage_leads'), leadController.createLead);
router.post('/from-inbox/:conversationId', verifyPermission('can_manage_leads'), leadController.createLeadFromInbox);
router.get('/:leadId/meetings', verifyLeadAccess, leadMeetingController.getLeadMeetings);
router.post('/:leadId/meetings', verifyPermission('can_manage_leads'), leadMeetingController.createLeadMeeting);
router.put('/:leadId/meetings/:id', verifyPermission('can_manage_leads'), leadMeetingController.updateLeadMeeting);
router.delete('/:leadId/meetings/:id', verifyPermission('can_manage_leads'), leadMeetingController.deleteLeadMeeting);
router.get('/:leadId/calls', verifyLeadAccess, leadCallController.getLeadCalls);
router.post('/:leadId/calls', verifyPermission('can_manage_leads'), leadCallController.createLeadCall);
router.put('/:leadId/calls/:id', verifyLeadAccess, leadCallController.updateLeadCall);
router.delete('/:leadId/calls/:id', verifyPermission('can_manage_leads'), leadCallController.deleteLeadCall);
router.post('/:leadId/calls/:id/notes', verifyLeadAccess, leadCallController.addCallNote);
router.put('/:id', verifyPermission('can_manage_leads'), leadController.updateLead);
router.put('/:id/status', verifyPermission('can_manage_leads'), leadController.updateLeadStatus);
router.delete('/:id', verifyPermission('can_manage_leads'), leadController.deleteLead);
router.post('/:id/convert', verifyPermission('can_manage_leads'), leadController.convertLeadToClient);

export default router;

