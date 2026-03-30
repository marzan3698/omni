import { PrismaClient, ExchangeOrderStatus } from '@prisma/client';
import { notificationService } from './notification.service.js';

const prisma = new PrismaClient();

export class ExchangeService {

  // ── RATES ──────────────────────────────────────────────────────────────

  async getRates(companyId: number, activeOnly = true) {
    return prisma.exchangeRate.findMany({
      where: { companyId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRate(companyId: number, data: {
    sendCurrency: string;
    receiveCurrency: string;
    rate: number;
    minAmount?: number;
    maxAmount?: number;
    reserves?: number;
    adminReceiveAccount?: string;
    adminReceiveQrCode?: string;
    note?: string;
    isActive?: boolean;
  }) {
    return prisma.exchangeRate.create({
      data: {
        companyId,
        sendCurrency: data.sendCurrency,
        receiveCurrency: data.receiveCurrency,
        rate: data.rate,
        minAmount: data.minAmount ?? 1,
        maxAmount: data.maxAmount ?? 99999,
        reserves: data.reserves ?? 0,
        adminReceiveAccount: data.adminReceiveAccount,
        adminReceiveQrCode: data.adminReceiveQrCode,
        note: data.note,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateRate(id: number, companyId: number, data: Partial<{
    sendCurrency: string;
    receiveCurrency: string;
    rate: number;
    minAmount: number;
    maxAmount: number;
    reserves: number;
    adminReceiveAccount: string;
    adminReceiveQrCode: string;
    note: string;
    isActive: boolean;
  }>) {
    return prisma.exchangeRate.update({
      where: { id, companyId },
      data,
    });
  }

  async deleteRate(id: number, companyId: number) {
    return prisma.exchangeRate.delete({ where: { id, companyId } });
  }

  // ── ORDERS ─────────────────────────────────────────────────────────────

  private generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EXC-${ts}-${rand}`;
  }

  async createOrder(companyId: number, clientId: string, data: {
    sendCurrency: string;
    receiveCurrency: string;
    sendAmount: number;
    senderAccount?: string;
    receiverAccount: string;
    transactionId: string;
    proofImage?: string;
  }) {
    if (!data.transactionId || data.transactionId.trim() === '') {
      throw new Error('Transaction ID is required to submit an exchange order');
    }
    // Find the applicable rate
    const rate = await prisma.exchangeRate.findFirst({
      where: {
        companyId,
        sendCurrency: data.sendCurrency,
        receiveCurrency: data.receiveCurrency,
        isActive: true,
      },
    });

    if (!rate) throw new Error('No active rate found for this currency pair');

    const appliedRate = Number(rate.rate);
    const receiveAmount = data.sendAmount * appliedRate;

    // Determine order type: if receiving BDT it's SELL, else BUY
    const type = data.receiveCurrency.toUpperCase().includes('BDT') ? 'SELL' : 'BUY';

    const order = await prisma.exchangeOrder.create({
      data: {
        companyId,
        orderNumber: this.generateOrderNumber(),
        clientId,
        type,
        sendCurrency: data.sendCurrency,
        receiveCurrency: data.receiveCurrency,
        sendAmount: data.sendAmount,
        receiveAmount,
        appliedRate,
        senderAccount: data.senderAccount,
        receiverAccount: data.receiverAccount,
        transactionId: data.transactionId,
        proofImage: data.proofImage,
        status: 'PENDING',
      },
      include: { client: { select: { id: true, email: true } } },
    });

    // Send notification to admin
    try {
      await notificationService.createNotification({
        companyId,
        title: 'New Dollar Exchange Order',
        message: `Customer placed order ${order.orderNumber} for ${order.sendAmount} ${order.sendCurrency} → ${order.receiveCurrency}`,
        type: 'exchange',
        link: '/dollar-exchange',
      });
    } catch (err) {
      console.error('Failed to create exchange notification:', err);
    }

    return order;
  }

  async getClientOrders(companyId: number, clientId: string) {
    return prisma.exchangeOrder.findMany({
      where: { companyId, clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllOrders(companyId: number, status?: ExchangeOrderStatus) {
    return prisma.exchangeOrder.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: {
        client: { select: { id: true, email: true, name: true, phone: true, address: true, profileImage: true } },
        processor: { select: { id: true, email: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderDetails(id: number, companyId: number) {
    return prisma.exchangeOrder.findFirst({
      where: { id, companyId },
      include: {
        client: { select: { id: true, email: true, name: true, phone: true, address: true, profileImage: true } },
        processor: { select: { id: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });
  }

  async updateOrderStatus(
    id: number,
    companyId: number,
    status: ExchangeOrderStatus,
    processedBy: string,
    adminNote?: string
  ) {
    return prisma.exchangeOrder.update({
      where: { id, companyId },
      data: {
        status,
        adminNote,
        processedBy,
        processedAt: status === 'COMPLETED' || status === 'REJECTED' ? new Date() : null,
      },
    });
  }

  async getStats(companyId: number) {
    const [total, pending, processing, completed, rejected] = await Promise.all([
      prisma.exchangeOrder.count({ where: { companyId } }),
      prisma.exchangeOrder.count({ where: { companyId, status: 'PENDING' } }),
      prisma.exchangeOrder.count({ where: { companyId, status: 'PROCESSING' } }),
      prisma.exchangeOrder.count({ where: { companyId, status: 'COMPLETED' } }),
      prisma.exchangeOrder.count({ where: { companyId, status: 'REJECTED' } }),
    ]);
    return { total, pending, processing, completed, rejected };
  }
}

export const exchangeService = new ExchangeService();
