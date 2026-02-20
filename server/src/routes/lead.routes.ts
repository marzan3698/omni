import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { leadMeetingController } from '../controllers/leadMeeting.controller.js';
import { leadCallController } from '../controllers/leadCall.controller.js';
import { authMiddleware, verifyPermission, verifyPermissionAny, verifyLeadAccess, verifyMeetingAccess } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Lead routes - allow can_view_leads so assigned users can see their leads list
router.get('/', verifyPermissionAny(['can_manage_leads', 'can_view_leads']), leadController.getAllLeads);
router.get('/pipeline', verifyPermission('can_manage_leads'), leadController.getLeadPipeline);
router.get('/lead-managers', verifyPermission('can_manage_leads'), leadController.getLeadManagers);
router.get('/client', leadController.getClientLeads); // Client route - no permission check needed, handled in service
router.get('/:id', verifyLeadAccess, leadController.getLeadById);
router.post('/', verifyPermission('can_manage_leads'), leadController.createLead);
router.post('/from-inbox/:conversationId', verifyPermissionAny(['can_manage_leads', 'can_view_leads']), leadController.createLeadFromInbox);
router.get('/:leadId/meetings', verifyLeadAccess, leadMeetingController.getLeadMeetings);
router.post('/:leadId/meetings', verifyPermission('can_manage_leads'), leadMeetingController.createLeadMeeting);
router.put('/:leadId/meetings/:id', verifyMeetingAccess, leadMeetingController.updateLeadMeeting);
router.delete('/:leadId/meetings/:id', verifyMeetingAccess, leadMeetingController.deleteLeadMeeting);
router.get('/:leadId/calls', verifyLeadAccess, leadCallController.getLeadCalls);
router.post('/:leadId/calls', verifyPermission('can_manage_leads'), leadCallController.createLeadCall);
router.put('/:leadId/calls/:id', verifyLeadAccess, leadCallController.updateLeadCall);
router.delete('/:leadId/calls/:id', verifyPermission('can_manage_leads'), leadCallController.deleteLeadCall);
router.post('/:leadId/calls/:id/notes', verifyLeadAccess, leadCallController.addCallNote);
router.put('/:id', verifyPermissionAny(['can_manage_leads', 'can_edit_leads']), leadController.updateLead);
router.put('/:id/status', verifyPermission('can_manage_leads'), leadController.updateLeadStatus);
router.put('/:id/monitoring/transfer', verifyPermission('can_manage_leads'), leadController.transferLeadMonitoring);
router.post('/:id/assign', verifyPermission('can_manage_leads'), leadController.assignUsers);
router.delete('/:id/assign/:employeeId', verifyPermission('can_manage_leads'), leadController.removeAssignment);
router.delete('/:id', verifyPermission('can_manage_leads'), leadController.deleteLead);
router.post('/:id/convert', verifyPermission('can_manage_leads'), leadController.convertLeadToClient);

export default router;

