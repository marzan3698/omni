import { prisma } from '../lib/prisma.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatwootConfig {
    baseUrl: string;   // e.g. https://app.chatwoot.com
    apiToken: string;  // User Access Token
    accountId: number; // Chatwoot Account ID
    webhookSecret?: string;
}

// ─── Config helpers ───────────────────────────────────────────────────────────

/**
 * Load Chatwoot config from SystemSetting for a company.
 * Returns null if not configured.
 */
export async function getChatwootConfig(companyId: number): Promise<ChatwootConfig | null> {
    const settings = await prisma.systemSetting.findMany({
        where: {
            companyId,
            key: { in: ['chatwoot_base_url', 'chatwoot_api_token', 'chatwoot_account_id', 'chatwoot_webhook_secret'] },
        },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
        map[s.key] = s.value;
    }

    if (!map['chatwoot_base_url'] || !map['chatwoot_api_token'] || !map['chatwoot_account_id']) {
        return null;
    }

    return {
        baseUrl: map['chatwoot_base_url'].replace(/\/$/, ''),
        apiToken: map['chatwoot_api_token'],
        accountId: parseInt(map['chatwoot_account_id'], 10),
        webhookSecret: map['chatwoot_webhook_secret'] || undefined,
    };
}

/**
 * Save Chatwoot config to SystemSetting for a company.
 */
export async function saveChatwootConfig(companyId: number, config: Partial<ChatwootConfig>): Promise<void> {
    const pairs: { key: string; value: string }[] = [];

    if (config.baseUrl !== undefined) pairs.push({ key: 'chatwoot_base_url', value: config.baseUrl });
    if (config.apiToken !== undefined) pairs.push({ key: 'chatwoot_api_token', value: config.apiToken });
    if (config.accountId !== undefined) pairs.push({ key: 'chatwoot_account_id', value: String(config.accountId) });
    if (config.webhookSecret !== undefined) pairs.push({ key: 'chatwoot_webhook_secret', value: config.webhookSecret });

    for (const { key, value } of pairs) {
        await prisma.systemSetting.upsert({
            where: { companyId_key: { companyId, key } },
            update: { value },
            create: { companyId, key, value },
        });
    }
}

// ─── Channel detection ────────────────────────────────────────────────────────

/**
 * Detect whatsapp or facebook from Chatwoot inbox channel type.
 * Chatwoot uses: 'Channel::Whatsapp', 'Channel::FacebookPage', 'Channel::Api', etc.
 */
export function detectPlatformFromChatwoot(channelType: string): 'whatsapp' | 'facebook' {
    const t = (channelType || '').toLowerCase();
    if (t.includes('whatsapp')) return 'whatsapp';
    return 'facebook';
}

// ─── Webhook processing ───────────────────────────────────────────────────────

/**
 * Process a Chatwoot webhook payload.
 * Supported events: message_created (from customer), conversation_created
 */
export async function processChatwootWebhook(payload: any, companyId: number): Promise<void> {
    const event = payload.event;

    if (event !== 'message_created' && event !== 'conversation_created') {
        // Ignore other events silently
        return;
    }

    const chatwootConvId: number = payload.conversation?.id || payload.id;
    if (!chatwootConvId) return;

    // Only process customer messages (not agent/bot)
    if (event === 'message_created') {
        const msgType = payload.message_type; // 0 = incoming (customer), 1 = outgoing (agent)
        if (msgType !== 0) return; // Skip outgoing messages
    }

    const inbox = payload.meta?.channel || payload.inbox || {};
    const inboxName: string = payload.meta?.sender?.name || inbox.name || payload.inbox_id || 'Unknown Inbox';
    const channelType: string = inbox.channel_type || inbox.channelType || '';
    const platform = detectPlatformFromChatwoot(channelType);

    const sender = payload.meta?.sender || payload.sender || {};
    const externalUserId: string = String(sender.id || sender.identifier || chatwootConvId);
    const externalUserName: string = sender.name || sender.email || 'Customer';

    // Find or create conversation in our DB
    let conversation = await prisma.socialConversation.findFirst({
        where: { companyId, chatwootConversationId: chatwootConvId },
    });

    if (!conversation) {
        conversation = await prisma.socialConversation.create({
            data: {
                companyId,
                platform,
                externalUserId,
                externalUserName,
                chatwootConversationId: chatwootConvId,
                chatwootInboxName: inboxName,
                lastMessageAt: new Date(),
            },
        });
        console.log(`✅ Chatwoot: new conversation created (id=${conversation.id}, chatwoot=${chatwootConvId})`);
    }

    // For message_created events, store the message
    if (event === 'message_created') {
        const messageBody: string = payload.content || payload.message || '';
        if (!messageBody && !payload.attachments?.length) return;

        const externalMsgId = String(payload.id || Date.now());

        // Prevent duplicates
        const exists = await prisma.socialMessage.findFirst({
            where: { externalMessageId: externalMsgId },
        });
        if (exists) return;

        await prisma.socialMessage.create({
            data: {
                conversationId: conversation.id,
                senderType: 'customer',
                content: messageBody,
                externalMessageId: externalMsgId,
                isRead: false,
            },
        });

        // Update lastMessageAt
        await prisma.socialConversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() },
        });

        console.log(`✅ Chatwoot: message saved (conv=${conversation.id})`);

        // Emit socket event for real-time update
        try {
            const io = (global as any).io;
            if (io) {
                io.emit('new_message', {
                    conversationId: conversation.id,
                    platform,
                    inboxName,
                });
            }
        } catch (_) { }
    }
}

// ─── Send reply to Chatwoot ───────────────────────────────────────────────────

/**
 * Send a reply from CRM → Chatwoot API so the agent reply appears in Chatwoot.
 */
export async function sendReplyToChatwoot(
    chatwootConversationId: number,
    content: string,
    config: ChatwootConfig,
): Promise<void> {
    const url = `${config.baseUrl}/api/v1/accounts/${config.accountId}/conversations/${chatwootConversationId}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api_access_token': config.apiToken,
        },
        body: JSON.stringify({
            content,
            message_type: 'outgoing',
            private: false,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        console.error(`❌ Chatwoot reply failed (${response.status}): ${body}`);
        throw new Error(`Chatwoot API error: ${response.status}`);
    }

    console.log(`✅ Chatwoot: reply sent to conversation ${chatwootConversationId}`);
}

// ─── Test connection ──────────────────────────────────────────────────────────

/**
 * Ping Chatwoot API to verify the config is valid.
 */
export async function testChatwootConnection(config: ChatwootConfig): Promise<{ ok: boolean; message: string }> {
    try {
        const url = `${config.baseUrl}/api/v1/profile`;
        const res = await fetch(url, {
            headers: { 'api_access_token': config.apiToken },
        });

        if (res.ok) {
            const data: any = await res.json();
            return { ok: true, message: `Connected as: ${data.name || data.email || 'Agent'}` };
        }
        return { ok: false, message: `API returned ${res.status}` };
    } catch (err: any) {
        return { ok: false, message: err.message || 'Connection failed' };
    }
}
