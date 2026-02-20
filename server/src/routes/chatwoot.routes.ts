import { Router } from 'express';
import { chatwootController } from '../controllers/chatwoot.controller.js';
import { authMiddleware, verifyRole } from '../middleware/authMiddleware.js';

const router = Router();

// ─── Public webhook (called by Chatwoot, no auth) ────────────────────────────
router.post('/webhooks/chatwoot', chatwootController.handleWebhook);

// ─── SuperAdmin-only config endpoints ────────────────────────────────────────
router.use(authMiddleware, verifyRole(['SuperAdmin']));

router.get('/chatwoot/config', chatwootController.getConfig);
router.post('/chatwoot/config', chatwootController.saveConfig);
router.post('/chatwoot/test', chatwootController.testConnection);
router.delete('/chatwoot/config', chatwootController.deleteConfig);

export default router;
