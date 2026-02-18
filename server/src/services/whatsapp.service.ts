import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { integrationService } from './integration.service.js';
import * as autoAssignService from './autoAssign.service.js';

const require = createRequire(import.meta.url);

// Lazy-load whatsapp-web.js so server starts even if module is unavailable (e.g. cPanel)
let whatsappAvailable = false;
let WhatsAppClient: any = null;
let LocalAuth: any = null;
try {
  const ww = require('whatsapp-web.js');
  WhatsAppClient = ww.Client;
  LocalAuth = ww.LocalAuth;
  whatsappAvailable = true;
} catch (e) {
  console.warn('⚠️  whatsapp-web.js not available. WhatsApp features disabled.');
}

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

const INIT_QR_TIMEOUT_MS = 35_000;

/**
 * Initialize WhatsApp client for a company slot. Generates QR and emits via Socket.IO.
 * Returns immediately - QR code will be sent via socket when ready.
 * If no qr/ready/auth_failure within timeout, session is cleared and init retried once.
 */
export async function initializeClient(
  companyId: number,
  slotId: string,
  isRetry = false
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

  if (!whatsappAvailable || !WhatsAppClient || !LocalAuth) {
    return { success: false, message: 'WhatsApp is not available on this server.' };
  }

  const client = new WhatsAppClient({
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

  let initTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const clearInitTimeout = () => {
    if (initTimeoutId != null) {
      clearTimeout(initTimeoutId);
      initTimeoutId = null;
    }
  };

  client.on('qr', async (qr: string) => {
    clearInitTimeout();
    try {
      console.log('WhatsApp QR generated for company:', companyId, 'slot:', slotId);
      const qrDataUrl = await QRCode.toDataURL(qr);
      emitToCompanySlot(companyId, slotId, `whatsapp:qr:${slotId}`, qrDataUrl);
    } catch (err) {
      console.error('WhatsApp QR code error:', err);
    }
  });

  client.on('ready', async () => {
    clearInitTimeout();
    console.log('WhatsApp client ready for company:', companyId, 'slot:', slotId);
    clients.set(key, { client, isReady: true, companyId, slotId });
    const phoneNumber = (client as any).info?.wid?.user;
    try {
      await integrationService.upsertIntegration({
        provider: 'whatsapp',
        pageId: getPageId(slotId),
        accessToken: 'session-active',
        companyId,
        isActive: true,
        accountId: phoneNumber ?? undefined,
      });
    } catch (e) {
      console.error('WhatsApp integration upsert error:', e);
    }
    emitToCompanySlot(companyId, slotId, `whatsapp:ready:${slotId}`);
  });

  client.on('authenticated', () => {
    clearInitTimeout();
    console.log('WhatsApp authenticated for company:', companyId, 'slot:', slotId);
    emitToCompanySlot(companyId, slotId, `whatsapp:authenticated:${slotId}`);
  });

  client.on('auth_failure', (msg: string) => {
    clearInitTimeout();
    console.error('WhatsApp auth failure:', msg);
    emitToCompanySlot(companyId, slotId, `whatsapp:auth_failure:${slotId}`, msg);
    clients.delete(key);
  });

  client.on('disconnected', (reason: string) => {
    clearInitTimeout();
    console.log('WhatsApp disconnected:', reason);
    clients.delete(key);
    emitToCompanySlot(companyId, slotId, `whatsapp:disconnected:${slotId}`, reason);
  });

  client.on('message', async (msg: any) => {
    await handleIncomingMessage(companyId, slotId, msg);
  });

  client.initialize().catch((err: Error) => {
    clearInitTimeout();
    console.error('WhatsApp client init error:', err);
    clients.delete(key);
    emitToCompanySlot(companyId, slotId, `whatsapp:disconnected:${slotId}`, err.message);
  });

  if (!isRetry) {
    initTimeoutId = setTimeout(async () => {
      initTimeoutId = null;
      const state = clients.get(key);
      if (!state || state.isReady) return;
      try {
        await state.client.destroy();
      } catch (e) {
        console.error('WhatsApp timeout destroy error:', e);
      }
      clients.delete(key);
      await clearSessionForSlot(companyId, slotId);
      emitToCompanySlot(companyId, slotId, `whatsapp:qr_retry:${slotId}`);
      await initializeClient(companyId, slotId, true);
    }, INIT_QR_TIMEOUT_MS);
  }

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
  persisted?: boolean;
}

/** Session folder path for LocalAuth (whatsapp-web.js convention). */
function getSessionDir(slotId: string, companyId: number): string {
  return path.join(process.cwd(), 'whatsapp-sessions', `session-company-${companyId}-slot-${slotId}`);
}

/**
 * Remove stored session for a slot so next connect generates a fresh QR.
 */
export async function clearSessionForSlot(companyId: number, slotId: string): Promise<void> {
  const dir = getSessionDir(slotId, companyId);
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
      console.log('WhatsApp: Cleared session for company', companyId, 'slot', slotId);
    }
  } catch (e: any) {
    if (e?.code !== 'ENOENT') {
      console.error('WhatsApp: clearSessionForSlot error', e);
    }
  }
}

export async function listSlots(companyId: number): Promise<SlotInfo[]> {
  const dbIntegrations = await prisma.integration.findMany({
    where: { companyId, provider: 'whatsapp' },
    select: { pageId: true, accountId: true },
  });
  const byPageId = new Map<string, { accountId: string | null }>();
  for (const row of dbIntegrations) {
    byPageId.set(row.pageId, { accountId: row.accountId });
  }

  const result: SlotInfo[] = [];
  for (const slotId of VALID_SLOT_IDS) {
    const key = getClientKey(companyId, slotId);
    const state = clients.get(key);
    const connected = !!(state?.isReady);
    let phoneNumber: string | undefined;
    let persisted = false;

    if (state?.isReady && state.client?.info?.wid?.user) {
      phoneNumber = state.client.info.wid.user;
      persisted = true;
    } else {
      const pageId = getPageId(slotId);
      const dbRow = byPageId.get(pageId);
      if (dbRow) {
        persisted = true;
        if (dbRow.accountId) phoneNumber = dbRow.accountId;
      }
    }
    result.push({ slotId, connected, phoneNumber, persisted });
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

function toJid(phone: string, useCUs = false): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.includes('@')) return phone;
  return useCUs ? `${digits}@c.us` : `${digits}@s.whatsapp.net`;
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
  const trySend = async (jid: string) => {
    const sent = await client.sendMessage(jid, content);
    return (sent as any)?.id?.id || (sent as any)?.id;
  };
  try {
    const jid = toJid(to);
    const messageId = await trySend(jid);
    emitToCompanySlot(companyId, slotId, 'whatsapp:message_sent', { to, messageId });
    return { success: true, messageId };
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('No LID for user')) {
      try {
        const jidCUs = toJid(to, true);
        const messageId = await trySend(jidCUs);
        emitToCompanySlot(companyId, slotId, 'whatsapp:message_sent', { to, messageId });
        return { success: true, messageId };
      } catch (err2: any) {
        console.error('WhatsApp send error (fallback @c.us failed):', err2);
        return {
          success: false,
          error: `WhatsApp slot ${slotId} needs reconnecting. Go to Integrations → Slot ${slotId} → Connect and scan QR again.`,
        };
      }
    }
    console.error('WhatsApp send error:', err);
    return { success: false, error: msg || 'Send failed' };
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
      await autoAssignService.autoAssignConversation(conversation.id, companyId);
    } else {
      await prisma.socialConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: now, status: 'Open' },
      });
      if (conversation.assignedTo == null) {
        await autoAssignService.autoAssignConversation(conversation.id, companyId);
      }
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
