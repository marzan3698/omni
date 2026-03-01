import { prisma } from '../lib/prisma.js';

export interface LogWebhookEventParams {
  integrationId: number;
  success: boolean;
  errorMessage?: string | null;
  payloadSnippet?: string | null;
  source?: 'facebook' | 'whatsapp' | 'chatwoot';
}

/**
 * Log a webhook event (success or failure) and update Integration.lastWebhookAt / lastError
 */
export async function logWebhookEvent(params: LogWebhookEventParams): Promise<void> {
  const { integrationId, success, errorMessage, payloadSnippet, source } = params;

  const snippet = payloadSnippet
    ? payloadSnippet.substring(0, 500)
    : null;

  await prisma.$transaction([
    prisma.integrationWebhookLog.create({
      data: {
        integrationId,
        success,
        errorMessage: errorMessage || null,
        payloadSnippet: snippet,
        source: source || null,
      },
    }),
    prisma.integration.update({
      where: { id: integrationId },
      data: {
        lastWebhookAt: new Date(),
        lastError: success ? null : (errorMessage || undefined),
      },
    }),
  ]);
}

/**
 * Get webhook log entries with optional integration filter
 */
export async function getWebhookLog(
  companyId: number,
  options: { limit?: number; integrationId?: number } = {}
) {
  const { limit = 50, integrationId } = options;

  const where: { integration: { companyId: number }; integrationId?: number } = {
    integration: { companyId },
  };
  if (integrationId) {
    where.integrationId = integrationId;
  }

  const items = await prisma.integrationWebhookLog.findMany({
    where,
    include: {
      integration: {
        select: {
          id: true,
          displayName: true,
          pageId: true,
          provider: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return {
    items,
    pagination: { limit, total: items.length },
  };
}
