import axios from 'axios';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import * as facebookAppConfig from './facebookAppConfig.service.js';
import { integrationService } from './integration.service.js';

const GRAPH_API_VERSION = 'v18.0';

interface OAuthState {
  companyId: number;
  userId: string;
  expiresAt: Date;
}

interface ConnectSession {
  companyId: number;
  userAccessToken: string;
  pages: Array<{ id: string; name: string; access_token: string }>;
  expiresAt: Date;
}

const oauthStateStore = new Map<string, OAuthState>();
const connectSessionStore = new Map<string, ConnectSession>();

setInterval(() => {
  const now = new Date();
  for (const [k, v] of oauthStateStore.entries()) {
    if (v.expiresAt < now) oauthStateStore.delete(k);
  }
  for (const [k, v] of connectSessionStore.entries()) {
    if (v.expiresAt < now) connectSessionStore.delete(k);
  }
}, 5 * 60 * 1000);

export async function getConnectUrl(companyId: number, userId: string, baseUrl: string): Promise<{ url: string; state: string }> {
  const config = await facebookAppConfig.getConfig(companyId);
  if (!config) throw new AppError('Facebook App not configured for this company. Set App ID, Secret and Verify Token in Settings.', 400);

  const state = crypto.randomBytes(32).toString('hex');
  oauthStateStore.set(state, { companyId, userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

  const redirectUri = config.redirectUriOverride || `${baseUrl.replace(/\/$/, '')}/api/integrations/facebook/callback`;
  const scopes = ['pages_show_list', 'pages_messaging', 'pages_manage_metadata', 'business_management'].join(',');

  const url = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?` +
    `client_id=${config.appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${scopes}&state=${state}&response_type=code`;
  return { url, state };
}

export async function handleCallback(code: string, state: string, baseUrl: string): Promise<{ connectSessionId: string }> {
  const stateData = oauthStateStore.get(state);
  if (!stateData || stateData.expiresAt < new Date()) {
    oauthStateStore.delete(state);
    throw new AppError('Invalid or expired OAuth state', 400);
  }
  const { companyId } = stateData;
  oauthStateStore.delete(state);

  const config = await facebookAppConfig.getConfig(companyId);
  if (!config) throw new AppError('Facebook App config not found', 500);

  const redirectUri = config.redirectUriOverride || `${baseUrl.replace(/\/$/, '')}/api/integrations/facebook/callback`;

  const tokenRes = await axios.get(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`,
    {
      params: {
        client_id: config.appId,
        client_secret: config.appSecret,
        redirect_uri: redirectUri,
        code,
      },
    }
  ).catch((e: any) => {
    throw new AppError(e.response?.data?.error?.message || 'Failed to exchange code for token', e.response?.status || 500);
  });

  const shortLived = tokenRes.data?.access_token;
  if (!shortLived) throw new AppError('No access token in response', 500);

  const longLivedRes = await axios.get(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`,
    {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: config.appId,
        client_secret: config.appSecret,
        fb_exchange_token: shortLived,
      },
    }
  ).catch(() => {
    throw new AppError('Failed to get long-lived token', 500);
  });

  const longLived = longLivedRes.data?.access_token;
  if (!longLived) throw new AppError('No long-lived token', 500);

  const pagesRes = await axios.get(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts`,
    { params: { access_token: longLived, fields: 'id,name,access_token' } }
  ).catch((e: any) => {
    throw new AppError(e.response?.data?.error?.message || 'Failed to get pages', e.response?.status || 500);
  });

  const pages = (pagesRes.data?.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    access_token: p.access_token,
  }));

  const connectSessionId = crypto.randomBytes(24).toString('hex');
  connectSessionStore.set(connectSessionId, {
    companyId,
    userAccessToken: longLived,
    pages,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  return { connectSessionId };
}

export function getConnectSessionPages(connectSessionId: string): Array<{ id: string; name: string }> {
  const session = connectSessionStore.get(connectSessionId);
  if (!session || session.expiresAt < new Date()) {
    connectSessionStore.delete(connectSessionId);
    throw new AppError('Invalid or expired connect session', 400);
  }
  return session.pages.map((p) => ({ id: p.id, name: p.name }));
}

export async function connectPages(companyId: number, connectSessionId: string, pageIds: string[]): Promise<unknown[]> {
  const session = connectSessionStore.get(connectSessionId);
  if (!session || session.expiresAt < new Date()) {
    connectSessionStore.delete(connectSessionId);
    throw new AppError('Invalid or expired connect session', 400);
  }
  if (session.companyId !== companyId) throw new AppError('Company mismatch', 403);

  const config = await facebookAppConfig.getConfig(companyId);
  if (!config) throw new AppError('Facebook App config not found', 500);

  const results: unknown[] = [];
  const validatedAt = new Date();
  for (const pageId of pageIds) {
    const page = session.pages.find((p) => p.id === pageId);
    if (!page) continue;

    try {
      if (!page.access_token) {
        results.push({
          pageId,
          name: page.name,
          success: false,
          error: 'Missing page access token from Facebook. Remove the app connection and reconnect with required permissions.',
        });
        continue;
      }

      let subscribeOk = false;
      let subscribeError: string | null = null;

      try {
        await axios.post(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps`,
          {},
          {
            params: {
              access_token: page.access_token,
              // Facebook expects specific field names (e.g. message_reads, message_deliveries)
              subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads',
            },
          }
        );
        subscribeOk = true;
      } catch (e: any) {
        subscribeOk = false;
        subscribeError = e.response?.data?.error?.message || e.message || 'Failed to subscribe app to page webhooks';
      }

      const integration = await integrationService.upsertIntegration({
        provider: 'facebook',
        pageId,
        accessToken: page.access_token,
        companyId,
        isActive: true,
        isWebhookActive: subscribeOk,
        displayName: page.name,
        lastError: subscribeOk ? null : subscribeError,
        lastValidatedAt: validatedAt,
      });

      results.push({
        pageId,
        name: page.name,
        integrationId: (integration as any)?.id,
        success: subscribeOk,
        error: subscribeOk ? undefined : subscribeError,
      });
    } catch (err: any) {
      results.push({ pageId, name: page.name, success: false, error: err.message });
    }
  }
  connectSessionStore.delete(connectSessionId);
  return results;
}

export async function getDiagnostics(companyId: number, pageId: string) {
  const integration = await prisma.integration.findFirst({
    where: { companyId, provider: 'facebook', pageId },
  });
  if (!integration) {
    return { found: false, steps: [{ step: 'integration', ok: false, message: 'No integration found for this page' }] };
  }

  const steps: Array<{ step: string; ok: boolean; message?: string }> = [];

  try {
    const meRes = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me`,
      { params: { access_token: integration.accessToken, fields: 'id,name' } }
    );
    steps.push({ step: 'token', ok: true, message: `Token valid. Page: ${meRes.data?.name || pageId}` });
  } catch (e: any) {
    steps.push({ step: 'token', ok: false, message: e.response?.data?.error?.message || 'Token invalid or expired' });
    return { found: true, steps };
  }

  try {
    const subRes = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps`,
      { params: { access_token: integration.accessToken } }
    );
    const subscribed = subRes.data?.data?.[0]?.subscribed_fields || [];
    const hasMessages = subscribed.some((s: string) => s.toLowerCase().includes('message'));
    steps.push({
      step: 'webhook_subscription',
      ok: hasMessages,
      message: hasMessages ? `Subscribed: ${subscribed.join(', ')}` : 'messages not in subscribed_fields',
    });
  } catch (e: any) {
    steps.push({ step: 'webhook_subscription', ok: false, message: e.response?.data?.error?.message || 'Check failed' });
  }

  return { found: true, steps };
}

export async function sendTestMessage(companyId: number, pageId: string) {
  const integration = await prisma.integration.findFirst({
    where: { companyId, provider: 'facebook', pageId },
  });
  if (!integration) throw new AppError('Integration not found for this page', 404);

  const externalUserId = `test-${pageId}-${Date.now()}`;
  const now = new Date();

  let conv = await prisma.socialConversation.findFirst({
    where: {
      companyId,
      platform: 'facebook',
      externalUserId,
      facebookPageId: pageId,
    },
  });

  if (!conv) {
    conv = await prisma.socialConversation.create({
      data: {
        companyId,
        platform: 'facebook',
        externalUserId,
        externalUserName: 'Test User (Inbox Test)',
        status: 'Open',
        lastMessageAt: now,
        facebookPageId: pageId,
        facebookPageName: integration.displayName || undefined,
      },
    });
  }

  await prisma.socialMessage.create({
    data: {
      conversationId: conv.id,
      senderType: 'customer',
      content: '[Test message from Omni – you can reply from this inbox]',
      createdAt: now,
    },
  });

  await prisma.socialConversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: now, status: 'Open' },
  });

  return { conversationId: conv.id, message: 'Test message created in inbox' };
}

export async function disconnectPage(companyId: number, integrationId: number): Promise<void> {
  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, companyId, provider: 'facebook' },
  });
  if (!integration) throw new AppError('Integration not found for this company', 404);

  const pageId = integration.pageId;
  const accessToken = integration.accessToken;
  if (accessToken) {
    try {
      await axios.delete(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps`,
        { params: { access_token: accessToken } }
      );
    } catch (e: any) {
      if (e.response?.status !== 200) {
        console.warn('Facebook unsubscribe failed (continuing with delete):', e.response?.data || e.message);
      }
    }
  }
  await prisma.integration.delete({ where: { id: integrationId } });
}
