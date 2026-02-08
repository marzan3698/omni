import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';
import { clientApprovalController } from '../controllers/clientApproval.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/pending', verifyPermission('can_approve_clients'), clientApprovalController.getPending);
router.post('/:id/approve', verifyPermission('can_approve_clients'), clientApprovalController.approve);

export default router;
