import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Lead routes
router.get('/', verifyPermission('can_manage_leads'), leadController.getAllLeads);
router.get('/pipeline', verifyPermission('can_manage_leads'), leadController.getLeadPipeline);
router.get('/:id', verifyPermission('can_manage_leads'), leadController.getLeadById);
router.post('/', verifyPermission('can_manage_leads'), leadController.createLead);
router.post('/from-inbox/:conversationId', verifyPermission('can_manage_leads'), leadController.createLeadFromInbox);
router.put('/:id', verifyPermission('can_manage_leads'), leadController.updateLead);
router.put('/:id/status', verifyPermission('can_manage_leads'), leadController.updateLeadStatus);
router.delete('/:id', verifyPermission('can_manage_leads'), leadController.deleteLead);
router.post('/:id/convert', verifyPermission('can_manage_leads'), leadController.convertLeadToClient);

export default router;

