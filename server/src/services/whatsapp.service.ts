import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { integrationService } from './integration.service.js';

const require = createRequire(import.meta.url);
const { Client, LocalAuth } = require('whatsapp-web.js');

type SocketIOServer = import('socket.io').Server;

const WHATSAPP_PAGE_ID = 'whatsapp-web';

interface WhatsAppClientState {
  client: any;
  isReady: boolean;
}

const clients = new Map<number, WhatsAppClientState>();

function getIO(): SocketIOServer | null {
  return (global as any).io || null;
}

function emitToCompany(companyId: number, event: string, ...args: any[]) {
  const io = getIO();
  if (!io) return;
  io.to(`whatsapp-${companyId}`).emit(event, ...args);
}

/**
 * Initialize WhatsApp client for a company. Generates QR and emits via Socket.IO.
 * Returns immediately - QR code will be sent via socket when ready.
 */
export async function initializeClient(companyId: number): Promise<{ success: boolean; message?: string }> {
  if (clients.has(companyId)) {
    const state = clients.get(companyId)!;
    if (state.isReady) {
      return { success: true, message: 'Already connected' };
    }
    await disconnectClient(companyId);
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: `company-${companyId}`,
      dataPath: './whatsapp-sessions',
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  clients.set(companyId, { client, isReady: false });

  client.on('qr', async (qr: string) => {
    try {
      console.log('WhatsApp QR generated for company:', companyId);
      const qrDataUrl = await QRCode.toDataURL(qr);
      emitToCompany(companyId, 'whatsapp:qr', qrDataUrl);
    } catch (err) {
      console.error('WhatsApp QR code error:', err);
    }
  });

  client.on('ready', async () => {
    console.log('WhatsApp client ready for company:', companyId);
    clients.set(companyId, { client, isReady: true });
    try {
      await integrationService.upsertIntegration({
        provider: 'whatsapp',
        pageId: WHATSAPP_PAGE_ID,
        accessToken: 'session-active',
        companyId,
        isActive: true,
      });
    } catch (e) {
      console.error('WhatsApp integration upsert error:', e);
    }
    emitToCompany(companyId, 'whatsapp:ready');
  });

  client.on('authenticated', () => {
    console.log('WhatsApp authenticated for company:', companyId);
    emitToCompany(companyId, 'whatsapp:authenticated');
  });

  client.on('auth_failure', (msg: string) => {
    console.error('WhatsApp auth failure:', msg);
    emitToCompany(companyId, 'whatsapp:auth_failure', msg);
    clients.delete(companyId);
  });

  client.on('disconnected', (reason: string) => {
    console.log('WhatsApp disconnected:', reason);
    clients.delete(companyId);
    emitToCompany(companyId, 'whatsapp:disconnected', reason);
  });

  client.on('message', async (msg: any) => {
    await handleIncomingMessage(companyId, msg);
  });

  // Start initialization in background - don't wait
  client.initialize().catch((err: Error) => {
    console.error('WhatsApp client init error:', err);
    clients.delete(companyId);
    emitToCompany(companyId, 'whatsapp:disconnected', err.message);
  });

  // Return immediately - QR will come via socket
  return { success: true, message: 'Initializing, QR will be sent via socket' };
}

export function getClient(companyId: number): any | null {
  const state = clients.get(companyId);
  return state?.isReady ? state.client : null;
}

export async function disconnectClient(companyId: number): Promise<void> {
  const state = clients.get(companyId);
  if (!state) return;
  try {
    await state.client.destroy();
  } catch (e) {
    console.error('WhatsApp disconnect error:', e);
  }
  clients.delete(companyId);
  emitToCompany(companyId, 'whatsapp:disconnected', 'Disconnected by user');
}

export function getStatus(companyId: number): { connected: boolean } {
  const state = clients.get(companyId);
  return { connected: !!(state?.isReady) };
}

/**
 * Restore WhatsApp clients for all companies that have an active WhatsApp integration.
 * Call this on server startup so messages are received after a restart.
 */
export async function restoreActiveWhatsAppClients(): Promise<void> {
  try {
    const integrations = await prisma.integration.findMany({
      where: { provider: 'whatsapp', isActive: true },
      select: { companyId: true },
      distinct: ['companyId'],
    });
    const companyIds = integrations.map((i) => i.companyId);
    if (companyIds.length === 0) {
      console.log('WhatsApp: No active integrations to restore');
      return;
    }
    console.log('WhatsApp: Restoring clients for companies:', companyIds);
    for (const companyId of companyIds) {
      try {
        await initializeClient(companyId);
        console.log('WhatsApp: Init started for company', companyId);
      } catch (err) {
        console.error('WhatsApp: Restore failed for company', companyId, err);
      }
    }
  } catch (err) {
    console.error('WhatsApp: restoreActiveWhatsAppClients error', err);
  }
}

/**
 * Normalize phone to JID format (e.g. 1234567890@s.whatsapp.net)
 */
function toJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.includes('@') ? phone : `${digits}@s.whatsapp.net`;
}

/**
 * Send a text message to a number.
 */
export async function sendMessage(
  companyId: number,
  to: string,
  content: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getClient(companyId);
  if (!client) {
    return { success: false, error: 'WhatsApp not connected' };
  }
  try {
    const jid = toJid(to);
    const sent = await client.sendMessage(jid, content);
    const messageId = (sent as any)?.id?.id || (sent as any)?.id;
    emitToCompany(companyId, 'whatsapp:message_sent', { to, messageId });
    return { success: true, messageId };
  } catch (err: any) {
    console.error('WhatsApp send error:', err);
    return { success: false, error: err?.message || 'Send failed' };
  }
}

/**
 * Handle incoming message from whatsapp-web.js: find or create conversation, save message, emit socket.
 */
export async function handleIncomingMessage(companyId: number, msg: any): Promise<void> {
  try {
    const from = msg.from.replace('@s.whatsapp.net', '');
    const contact = await msg.getContact();
    console.log('WhatsApp: Incoming message from', from, 'companyId', companyId);
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

    let conversation = await prisma.socialConversation.findFirst({
      where: { companyId, platform: 'whatsapp', externalUserId: from },
    });

    if (!conversation) {
      conversation = await prisma.socialConversation.create({
        data: {
          companyId,
          platform: 'whatsapp',
          externalUserId: from,
          externalUserName: name,
          status: 'Open',
          lastMessageAt: now,
        },
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
    console.log('WhatsApp: Message saved to inbox conversationId=', conversation.id, 'messageId=', message.id);

    const io = getIO();
    if (io) {
      io.to(`whatsapp-${companyId}`).emit('whatsapp:message', {
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
