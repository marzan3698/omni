import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { integrationService } from './integration.service.js';

const require = createRequire(import.meta.url);
const { Client, LocalAuth } = require('whatsapp-web.js');

type SocketIOServer = import('socket.io').Server;

const MAX_SLOTS = 5;
const VALID_SLOT_IDS = ['1', '2', '3', '4', '5'];

function getPageId(slotId: string): string {
  return `whatsapp-slot-${slotId}`;
}

interface WhatsAppClientState {
  client: any;
  isReady: boolean;
  companyId: number;
  slotId: string;
}

const clients = new Map<string, WhatsAppClientState>();

function getClientKey(companyId: number, slotId: string): string {
  return `${companyId}-${slotId}`;
}

function getIO(): SocketIOServer | null {
  return (global as any).io || null;
}

function emitToCompanySlot(companyId: number, slotId: string, event: string, ...args: any[]) {
  const io = getIO();
  if (!io) return;
  io.to(`whatsapp-${companyId}-${slotId}`).emit(event, ...args);
}

export function isValidSlotId(slotId: string): boolean {
  return VALID_SLOT_IDS.includes(slotId);
}

/**
 * Initialize WhatsApp client for a company slot. Generates QR and emits via Socket.IO.
 * Returns immediately - QR code will be sent via socket when ready.
 */
export async function initializeClient(
  companyId: number,
  slotId: string
): Promise<{ success: boolean; message?: string }> {
  if (!isValidSlotId(slotId)) {
    return { success: false, message: 'Invalid slot. Use 1-5.' };
  }
  const key = getClientKey(companyId, slotId);
  if (clients.has(key)) {
    const state = clients.get(key)!;
    if (state.isReady) {
      return { success: true, message: 'Already connected' };
    }
    await disconnectClient(companyId, slotId);
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: `company-${companyId}-slot-${slotId}`,
      dataPath: './whatsapp-sessions',
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  clients.set(key, { client, isReady: false, companyId, slotId });

  client.on('qr', async (qr: string) => {
    try {
      console.log('WhatsApp QR generated for company:', companyId, 'slot:', slotId);
      const qrDataUrl = await QRCode.toDataURL(qr);
      emitToCompanySlot(companyId, slotId, `whatsapp:qr:${slotId}`, qrDataUrl);
    } catch (err) {
      console.error('WhatsApp QR code error:', err);
    }
  });

  client.on('ready', async () => {
    console.log('WhatsApp client ready for company:', companyId, 'slot:', slotId);
    clients.set(key, { client, isReady: true, companyId, slotId });
    try {
      await integrationService.upsertIntegration({
        provider: 'whatsapp',
        pageId: getPageId(slotId),
        accessToken: 'session-active',
        companyId,
        isActive: true,
      });
    } catch (e) {
      console.error('WhatsApp integration upsert error:', e);
    }
    emitToCompanySlot(companyId, slotId, `whatsapp:ready:${slotId}`);
  });

  client.on('authenticated', () => {
    console.log('WhatsApp authenticated for company:', companyId, 'slot:', slotId);
    emitToCompanySlot(companyId, slotId, `whatsapp:authenticated:${slotId}`);
  });

  client.on('auth_failure', (msg: string) => {
    console.error('WhatsApp auth failure:', msg);
    emitToCompanySlot(companyId, slotId, `whatsapp:auth_failure:${slotId}`, msg);
    clients.delete(key);
  });

  client.on('disconnected', (reason: string) => {
    console.log('WhatsApp disconnected:', reason);
    clients.delete(key);
    emitToCompanySlot(companyId, slotId, `whatsapp:disconnected:${slotId}`, reason);
  });

  client.on('message', async (msg: any) => {
    await handleIncomingMessage(companyId, slotId, msg);
  });

  client.initialize().catch((err: Error) => {
    console.error('WhatsApp client init error:', err);
    clients.delete(key);
    emitToCompanySlot(companyId, slotId, `whatsapp:disconnected:${slotId}`, err.message);
  });

  return { success: true, message: 'Initializing, QR will be sent via socket' };
}

export function getClient(companyId: number, slotId: string): any | null {
  const key = getClientKey(companyId, slotId);
  const state = clients.get(key);
  return state?.isReady ? state.client : null;
}

export async function disconnectClient(companyId: number, slotId: string): Promise<void> {
  const key = getClientKey(companyId, slotId);
  const state = clients.get(key);
  if (!state) return;
  try {
    await state.client.destroy();
  } catch (e) {
    console.error('WhatsApp disconnect error:', e);
  }
  clients.delete(key);
  emitToCompanySlot(companyId, slotId, `whatsapp:disconnected:${slotId}`, 'Disconnected by user');
}

export function getStatus(companyId: number, slotId: string): { connected: boolean } {
  const key = getClientKey(companyId, slotId);
  const state = clients.get(key);
  return { connected: !!(state?.isReady) };
}

export interface SlotInfo {
  slotId: string;
  connected: boolean;
  phoneNumber?: string;
}

export async function listSlots(companyId: number): Promise<SlotInfo[]> {
  const result: SlotInfo[] = [];
  for (const slotId of VALID_SLOT_IDS) {
    const key = getClientKey(companyId, slotId);
    const state = clients.get(key);
    const connected = !!(state?.isReady);
    let phoneNumber: string | undefined;
    if (state?.isReady && state.client?.info?.wid?.user) {
      phoneNumber = state.client.info.wid.user;
    }
    result.push({ slotId, connected, phoneNumber });
  }
  return result;
}

/**
 * Restore WhatsApp clients for all companies that have an active WhatsApp integration.
 * Call this on server startup so messages are received after a restart.
 */
export async function restoreActiveWhatsAppClients(): Promise<void> {
  try {
    const integrations = await prisma.integration.findMany({
      where: { provider: 'whatsapp', isActive: true },
      select: { companyId: true, pageId: true },
    });
    if (integrations.length === 0) {
      console.log('WhatsApp: No active integrations to restore');
      return;
    }
    for (const row of integrations) {
      const match = row.pageId.match(/^whatsapp-slot-(.+)$/);
      const slotId = (match && isValidSlotId(match[1])) ? match[1] : (row.pageId === 'whatsapp-web' ? '1' : null);
      if (!slotId) continue;
      try {
        await initializeClient(row.companyId, slotId);
        console.log('WhatsApp: Init started for company', row.companyId, 'slot', slotId);
      } catch (err) {
        console.error('WhatsApp: Restore failed for company', row.companyId, 'slot', slotId, err);
      }
    }
  } catch (err) {
    console.error('WhatsApp: restoreActiveWhatsAppClients error', err);
  }
}

function toJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.includes('@') ? phone : `${digits}@s.whatsapp.net`;
}

export async function sendMessage(
  companyId: number,
  slotId: string,
  to: string,
  content: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getClient(companyId, slotId);
  if (!client) {
    return { success: false, error: 'WhatsApp not connected for this slot' };
  }
  try {
    const jid = toJid(to);
    const sent = await client.sendMessage(jid, content);
    const messageId = (sent as any)?.id?.id || (sent as any)?.id;
    emitToCompanySlot(companyId, slotId, 'whatsapp:message_sent', { to, messageId });
    return { success: true, messageId };
  } catch (err: any) {
    console.error('WhatsApp send error:', err);
    return { success: false, error: err?.message || 'Send failed' };
  }
}

/**
 * Handle incoming message: find or create conversation (with slotId), save message, emit socket.
 */
export async function handleIncomingMessage(
  companyId: number,
  slotId: string,
  msg: any
): Promise<void> {
  try {
    const from = msg.from.replace('@s.whatsapp.net', '').replace('@c.us', '');
    const contact = await msg.getContact();
    console.log('WhatsApp: Incoming message from', from, 'companyId', companyId, 'slot', slotId);
    const name = contact?.name || contact?.pushname || from;
    let body = '';
    let imageUrl: string | null = null;

    if (msg.type === 'chat' && msg.body) {
      body = msg.body;
    } else if (msg.type === 'image' && msg.hasMedia) {
      try {
        const media = await msg.downloadMedia();
        if (media?.mimetype?.startsWith('image/') && media?.data) {
          const socialDir = path.join(process.cwd(), 'uploads', 'social');
          if (!fs.existsSync(socialDir)) fs.mkdirSync(socialDir, { recursive: true });
          const ext = media.mimetype.split('/')[1] || 'jpg';
          const filename = `whatsapp-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
          const filePath = path.join(socialDir, filename);
          fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));
          imageUrl = `/uploads/social/${filename}`;
        }
        body = msg.caption || '[Image]';
      } catch (e) {
        console.error('WhatsApp media download error:', e);
        body = '[Image]';
      }
    } else {
      body = msg.body || `[${msg.type}]`;
    }

    const now = new Date();

    // Find conversation: same slot, or legacy (null) treated as slot 1
    let conversation = await prisma.socialConversation.findFirst({
      where: {
        companyId,
        platform: 'whatsapp',
        externalUserId: from,
        ...(slotId === '1'
          ? { OR: [{ whatsappSlotId: '1' }, { whatsappSlotId: null }] }
          : { whatsappSlotId: slotId }),
      },
    });

    if (conversation && conversation.whatsappSlotId === null && slotId === '1') {
      await prisma.socialConversation.update({
        where: { id: conversation.id },
        data: { whatsappSlotId: '1' },
      });
    }

    const conversationData: Record<string, unknown> = {
      companyId,
      platform: 'whatsapp',
      externalUserId: from,
      externalUserName: name,
      status: 'Open',
      lastMessageAt: now,
      whatsappSlotId: slotId,
    };

    if (!conversation) {
      conversation = await prisma.socialConversation.create({
        data: conversationData as any,
      });
    } else {
      await prisma.socialConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: now, status: 'Open' },
      });
    }

    const message = await prisma.socialMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'customer',
        content: body,
        imageUrl,
        createdAt: now,
      },
    });
    console.log('WhatsApp: Message saved conversationId=', conversation.id, 'messageId=', message.id);

    const io = getIO();
    if (io) {
      io.to(`whatsapp-${companyId}-${slotId}`).emit('whatsapp:message', {
        conversationId: conversation.id,
        message: {
          id: message.id,
          content: message.content,
          imageUrl: message.imageUrl,
          senderType: message.senderType,
          createdAt: message.createdAt,
        },
      });
    }
  } catch (err) {
    console.error('WhatsApp handleIncomingMessage error:', err);
  }
}
