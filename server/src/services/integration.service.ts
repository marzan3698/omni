import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateIntegrationData {
  provider: 'facebook' | 'whatsapp';
  pageId: string;
  accessToken: string;
  accountId?: string;
  baseUrl?: string;
  isActive?: boolean;
  webhookMode?: 'local' | 'live';
  isWebhookActive?: boolean;
  companyId?: number;
  displayName?: string;
  metaJson?: object;
  lastError?: string | null;
  lastValidatedAt?: Date | null;
  lastWebhookAt?: Date | null;
}

interface UpdateIntegrationData {
  pageId?: string;
  accessToken?: string;
  accountId?: string;
  baseUrl?: string;
  isActive?: boolean;
  webhookMode?: 'local' | 'live';
  isWebhookActive?: boolean;
  displayName?: string;
  metaJson?: object;
  lastError?: string | null;
  lastValidatedAt?: Date | null;
  lastWebhookAt?: Date | null;
}

export const integrationService = {
  /**
   * Create or update an integration
   */
  async upsertIntegration(data: CreateIntegrationData) {
    const {
      provider,
      pageId,
      accessToken,
      accountId,
      baseUrl,
      isActive = true,
      webhookMode,
      isWebhookActive = false,
      companyId,
      displayName,
      metaJson,
      lastError,
      lastValidatedAt,
      lastWebhookAt,
    } = data;

    if (!companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!['facebook', 'whatsapp'].includes(provider)) {
      throw new AppError('Invalid provider. Must be facebook or whatsapp', 400);
    }

    const existing = await prisma.integration.findFirst({
      where: {
        companyId,
        provider: provider as 'facebook' | 'whatsapp',
        pageId,
      },
    });

    const integrationData: Record<string, unknown> = {
      accessToken,
      isActive,
      updatedAt: new Date(),
    };
    if (accountId !== undefined) integrationData.accountId = accountId;
    if (baseUrl !== undefined) integrationData.baseUrl = baseUrl;
    if (webhookMode !== undefined) integrationData.webhookMode = webhookMode;
    if (isWebhookActive !== undefined) integrationData.isWebhookActive = isWebhookActive;
    if (displayName !== undefined) integrationData.displayName = displayName;
    if (metaJson !== undefined) integrationData.metaJson = metaJson;
    if (lastError !== undefined) integrationData.lastError = lastError;
    if (lastValidatedAt !== undefined) integrationData.lastValidatedAt = lastValidatedAt;
    if (lastWebhookAt !== undefined) integrationData.lastWebhookAt = lastWebhookAt;

    const integration = existing
      ? await prisma.integration.update({
          where: { id: existing.id },
          data: integrationData as any,
        })
      : await prisma.integration.create({
          data: {
            provider: provider as 'facebook' | 'whatsapp',
            pageId,
            companyId,
            ...integrationData,
          } as any,
        });

    return integration;
  },

  /**
   * Get all integrations
   */
  async getIntegrations(companyId: number) {
    const integrations = await prisma.integration.findMany({
      where: { companyId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return integrations;
  },

  /**
   * Get integration by ID
   */
  async getIntegrationById(id: number) {
    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new AppError('Integration not found', 404);
    }

    return integration;
  },

  /**
   * Get integration by provider and pageId
   */
  async getIntegrationByProvider(provider: 'facebook' | 'whatsapp', pageId: string) {
    const integration = await prisma.integration.findUnique({
      where: {
        provider_pageId: {
          provider,
          pageId,
        },
      },
    });

    return integration;
  },

  /**
   * Update integration
   */
  async updateIntegration(id: number, data: UpdateIntegrationData) {
    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new AppError('Integration not found', 404);
    }

    const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
    const updated = await prisma.integration.update({
      where: { id },
      data: updatePayload as any,
    });

    return updated;
  },

  /**
   * Delete integration
   */
  async deleteIntegration(id: number) {
    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new AppError('Integration not found', 404);
    }

    await prisma.integration.delete({
      where: { id },
    });

    return { success: true };
  },
};

