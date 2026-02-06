import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import {
  initializeClient,
  disconnectClient,
  clearSessionForSlot,
  getStatus,
  listSlots,
  sendMessage as sendMessageService,
  isValidSlotId,
} from '../services/whatsapp.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';

const sendMessageSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  content: z.string().min(1, 'Message content is required'),
  slotId: z.string().optional(),
});

export const whatsappController = {
  connect: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company not found', 400);
      }
      const slotId = req.params.slotId;
      if (!slotId || !isValidSlotId(slotId)) {
        return sendError(res, 'Invalid slot. Use 1-5.', 400);
      }
      const result = await initializeClient(companyId, slotId);
      if (!result.success) {
        return sendError(res, result.message || 'Failed to initialize', 400);
      }
      sendSuccess(res, { status: 'initializing', slotId }, 'QR will be sent via socket');
    } catch (error) {
      next(error);
    }
  },

  connectRefresh: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company not found', 400);
      }
      const slotId = req.params.slotId;
      if (!slotId || !isValidSlotId(slotId)) {
        return sendError(res, 'Invalid slot. Use 1-5.', 400);
      }
      await disconnectClient(companyId, slotId);
      await clearSessionForSlot(companyId, slotId);
      const result = await initializeClient(companyId, slotId);
      if (!result.success) {
        return sendError(res, result.message || 'Failed to initialize', 400);
      }
      sendSuccess(res, { status: 'initializing', slotId }, 'New QR will be sent via socket');
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
      const slotId = req.params.slotId;
      if (!slotId || !isValidSlotId(slotId)) {
        return sendError(res, 'Invalid slot. Use 1-5.', 400);
      }
      await disconnectClient(companyId, slotId);
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
      const slotId = req.params.slotId;
      if (!slotId || !isValidSlotId(slotId)) {
        return sendError(res, 'Invalid slot. Use 1-5.', 400);
      }
      const status = getStatus(companyId, slotId);
      sendSuccess(res, { ...status, slotId });
    } catch (error) {
      next(error);
    }
  },

  listSlots: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company not found', 400);
      }
      const slots = await listSlots(companyId);
      sendSuccess(res, slots);
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
      const { to, content, slotId } = parsed.data;
      const useSlotId = slotId && isValidSlotId(slotId) ? slotId : '1';
      const result = await sendMessageService(companyId, useSlotId, to, content);
      if (!result.success) {
        return sendError(res, result.error || 'Send failed', 400);
      }
      sendSuccess(res, { messageId: result.messageId }, 'Message sent');
    } catch (error) {
      next(error);
    }
  },
};
