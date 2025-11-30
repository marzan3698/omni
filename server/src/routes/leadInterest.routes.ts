import { Router } from 'express';
import { leadInterestController } from '../controllers/leadInterest.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware); // All routes require authentication

router.post('/', verifyPermission('can_manage_lead_config'), leadInterestController.createInterest);
router.get('/', verifyPermission('can_view_leads'), leadInterestController.getInterests);
router.get('/:id', verifyPermission('can_view_leads'), leadInterestController.getInterestById);
router.put('/:id', verifyPermission('can_manage_lead_config'), leadInterestController.updateInterest);
router.delete('/:id', verifyPermission('can_manage_lead_config'), leadInterestController.deleteInterest);

export default router;

