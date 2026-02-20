import { Router } from 'express';
import { chatwootController } from '../controllers/chatwoot.controller.js';
import { authMiddleware, verifyRole } from '../middleware/authMiddleware.js';

const router = Router();

// ─── Public webhook (called by Chatwoot, no auth) ────────────────────────────
router.post('/webhooks/chatwoot', chatwootController.handleWebhook);

// ─── SuperAdmin-only config endpoints ────────────────────────────────────────
const chatwootAdminAuth = [authMiddleware, verifyRole(['SuperAdmin'])];

router.get('/chatwoot/config', chatwootAdminAuth, chatwootController.getConfig);
router.post('/chatwoot/config', chatwootAdminAuth, chatwootController.saveConfig);
router.post('/chatwoot/test', chatwootAdminAuth, chatwootController.testConnection);
router.delete('/chatwoot/config', chatwootAdminAuth, chatwootController.deleteConfig);

export default router;
