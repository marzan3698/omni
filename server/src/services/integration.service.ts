import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateIntegrationData {
  provider: 'facebook' | 'whatsapp' | 'chatwoot';
  pageId: string;
  accessToken: string;
  accountId?: string; // For Chatwoot: account_id
  baseUrl?: string; // For Chatwoot: base URL (optional, defaults to cloud)
  isActive?: boolean;
  webhookMode?: 'local' | 'live'; // For Chatwoot: webhook mode
  isWebhookActive?: boolean; // Enable/disable webhook
}

interface UpdateIntegrationData {
  pageId?: string;
  accessToken?: string;
  accountId?: string;
  baseUrl?: string;
  isActive?: boolean;
  webhookMode?: 'local' | 'live';
  isWebhookActive?: boolean;
}

export const integrationService = {
  /**
   * Create or update an integration
   */
  async upsertIntegration(data: CreateIntegrationData) {
    const { provider, pageId, accessToken, accountId, baseUrl, isActive = true, webhookMode, isWebhookActive = false } = data;

    // Validate provider
    if (!['facebook', 'whatsapp', 'chatwoot'].includes(provider)) {
      throw new AppError('Invalid provider. Must be facebook, whatsapp, or chatwoot', 400);
    }

    // Validate Chatwoot-specific fields
    if (provider === 'chatwoot') {
      if (!accountId) {
        throw new AppError('Account ID is required for Chatwoot integration', 400);
      }
    }

    // Check if integration exists
    const existing = await prisma.integration.findUnique({
      where: {
        provider_pageId: {
          provider: provider as 'facebook' | 'whatsapp' | 'chatwoot',
          pageId,
        },
      },
    });

    // If enabling this integration, disable all other integrations
    if (isActive === true) {
      const whereClause: any = {
        isActive: true,
      };
      
      if (existing) {
        whereClause.id = { not: existing.id };
      }
      
      await prisma.integration.updateMany({
        where: whereClause,
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    }

    // Prepare data for update/create
    const integrationData: any = {
      accessToken,
      isActive,
      updatedAt: new Date(),
    };

    // Add Chatwoot-specific fields if provider is chatwoot
    if (provider === 'chatwoot') {
      integrationData.accountId = accountId;
      integrationData.baseUrl = baseUrl || 'https://app.chatwoot.com';
      // Set webhook fields - use defaults if not provided
      integrationData.webhookMode = webhookMode || 'local';
      integrationData.isWebhookActive = isWebhookActive ?? false;
    }

    // Update or create
    const integration = existing
      ? await prisma.integration.update({
          where: { id: existing.id },
          data: integrationData,
        })
      : await prisma.integration.create({
          data: {
            provider: provider as 'facebook' | 'whatsapp' | 'chatwoot',
            pageId,
            ...integrationData,
          },
        });

    return integration;
  },

  /**
   * Get all integrations
   */
  async getIntegrations() {
    const integrations = await prisma.integration.findMany({
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
  async getIntegrationByProvider(provider: 'facebook' | 'whatsapp' | 'chatwoot', pageId: string) {
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

    const updated = await prisma.integration.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
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

