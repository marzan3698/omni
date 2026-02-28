import { Router } from 'express';
import { leadFormConfigController } from '../controllers/leadFormConfig.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

export const leadFormPublicRouter = Router();
leadFormPublicRouter.get('/default', leadFormConfigController.getDefaultPublicConfig);
leadFormPublicRouter.get('/public/:slug', leadFormConfigController.getPublicConfig);
leadFormPublicRouter.post('/public/:slug/submit', leadFormConfigController.submitLead);

export const leadFormConfigRouter = Router();
leadFormConfigRouter.use(authMiddleware);
leadFormConfigRouter.get('/', verifyPermission('can_manage_lead_config'), leadFormConfigController.getConfig);
leadFormConfigRouter.put('/', verifyPermission('can_manage_lead_config'), leadFormConfigController.updateConfig);
leadFormConfigRouter.get('/embed-code', verifyPermission('can_manage_lead_config'), leadFormConfigController.getEmbedCode);

export default leadFormPublicRouter;
