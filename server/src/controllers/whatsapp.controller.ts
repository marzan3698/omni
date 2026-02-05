import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import {
  initializeClient,
  disconnectClient,
  getStatus,
  sendMessage as sendMessageService,
} from '../services/whatsapp.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';

const sendMessageSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  content: z.string().min(1, 'Message content is required'),
});

export const whatsappController = {
  connect: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company not found', 400);
      }
      const result = await initializeClient(companyId);
      if (!result.success) {
        return sendError(res, result.message || 'Failed to initialize', 400);
      }
      sendSuccess(res, { status: 'initializing' }, 'QR will be sent via socket');
    } catch (error) {
      next(error);
    }
  },

  disconnect: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company not found', 400);
      }
      await disconnectClient(companyId);
      sendSuccess(res, {}, 'Disconnected');
    } catch (error) {
      next(error);
    }
  },

  getStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company not found', 400);
      }
      const status = getStatus(companyId);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  },

  sendMessage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company not found', 400);
      }
      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.errors[0]?.message || 'Invalid input', 400);
      }
      const { to, content } = parsed.data;
      const result = await sendMessageService(companyId, to, content);
      if (!result.success) {
        return sendError(res, result.error || 'Send failed', 400);
      }
      sendSuccess(res, { messageId: result.messageId }, 'Message sent');
    } catch (error) {
      next(error);
    }
  },
};
