import { Request, Response } from 'express';
import { exchangeService } from '../services/exchange.service.js';
import { ExchangeOrderStatus } from '@prisma/client';
import { AuthRequest } from '../types/index.js';

// ── CLIENT ENDPOINTS ─────────────────────────────────────────────────────────

export const getRates = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const rates = await exchangeService.getRates(companyId, true);
    return res.json({ success: true, data: rates });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderDetails = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    const userRole = req.user?.role?.name;

    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = parseInt(req.params.id);
    const order = await exchangeService.getOrderDetails(id, companyId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security: Only Admin/SuperAdmin can see any order. Clients can only see their own.
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin' && order.clientId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    if (!companyId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { sendCurrency, receiveCurrency, sendAmount, senderAccount, receiverAccount, transactionId } = req.body;

    if (!sendCurrency || !receiveCurrency || !sendAmount || !receiverAccount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (sendAmount <= 0) return res.status(400).json({ success: false, message: 'Amount must be positive' });

    const order = await exchangeService.createOrder(companyId, userId, {
      sendCurrency,
      receiveCurrency,
      sendAmount: Number(sendAmount),
      senderAccount,
      receiverAccount,
      transactionId,
    });

    return res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    if (!companyId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const orders = await exchangeService.getClientOrders(companyId, userId);
    return res.json({ success: true, data: orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const status = req.query.status as ExchangeOrderStatus | undefined;
    const orders = await exchangeService.getAllOrders(companyId, status);
    return res.json({ success: true, data: orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    if (!companyId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = parseInt(req.params.id);
    const { status, adminNote } = req.body;

    const validStatuses: ExchangeOrderStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await exchangeService.updateOrderStatus(id, companyId, status, userId, adminNote);
    return res.json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getRatesAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const rates = await exchangeService.getRates(companyId, false);
    return res.json({ success: true, data: rates });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createRate = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { sendCurrency, receiveCurrency, rate, minAmount, maxAmount, reserves, adminReceiveAccount, note, isActive } = req.body;
    if (!sendCurrency || !receiveCurrency || !rate) {
      return res.status(400).json({ success: false, message: 'Missing required fields: sendCurrency, receiveCurrency, rate' });
    }

    const newRate = await exchangeService.createRate(companyId, {
      sendCurrency, receiveCurrency, rate: Number(rate),
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      reserves: reserves ? Number(reserves) : undefined,
      adminReceiveAccount,
      note, isActive,
    });

    return res.status(201).json({ success: true, data: newRate });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRate = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = parseInt(req.params.id);
    const { sendCurrency, receiveCurrency, rate, minAmount, maxAmount, reserves, adminReceiveAccount, note, isActive } = req.body;

    const updated = await exchangeService.updateRate(id, companyId, {
      sendCurrency, receiveCurrency,
      rate: rate !== undefined ? Number(rate) : undefined,
      minAmount: minAmount !== undefined ? Number(minAmount) : undefined,
      maxAmount: maxAmount !== undefined ? Number(maxAmount) : undefined,
      reserves: reserves !== undefined ? Number(reserves) : undefined,
      adminReceiveAccount,
      note, isActive,
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRate = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = parseInt(req.params.id);
    await exchangeService.deleteRate(id, companyId);
    return res.json({ success: true, message: 'Rate deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const stats = await exchangeService.getStats(companyId);
    return res.json({ success: true, data: stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
