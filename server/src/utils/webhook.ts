/**
 * Webhook URL Helper Utilities
 * Generates webhook URLs based on mode (local/live) and integration settings
 */

export enum WebhookMode {
  local = 'local',
  live = 'live',
}

/**
 * Get webhook URL for Chatwoot integration
 * @param mode - 'local' or 'live'
 * @param integrationId - Optional integration ID to check stored mode
 * @returns Webhook URL string
 */
export async function getChatwootWebhookUrl(
  mode: WebhookMode = WebhookMode.local,
  integrationId?: number
): Promise<string> {
  // If integration ID is provided, try to get mode from database
  if (integrationId) {
    try {
      const { prisma } = await import('../lib/prisma.js');
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
        select: { webhookMode: true },
      });
      if (integration?.webhookMode) {
        mode = integration.webhookMode as WebhookMode;
      }
    } catch (error) {
      console.error('Error fetching integration webhook mode:', error);
      // Fallback to provided mode
    }
  }

  // Check for explicit Chatwoot webhook URL first (highest priority)
  const explicitWebhookUrl = process.env.CHATWOOT_WEBHOOK_URL;
  if (explicitWebhookUrl) {
    // If URL already includes the full path, return as is
    if (explicitWebhookUrl.includes('/api/chatwoot/webhooks/chatwoot')) {
      return explicitWebhookUrl;
    }
    // Otherwise append the path
    return `${explicitWebhookUrl}/api/chatwoot/webhooks/chatwoot`;
  }

  // Get base URL from environment or use defaults
  if (mode === WebhookMode.live) {
    // Live/production mode - use configured domain
    const liveUrl = process.env.LIVE_WEBHOOK_URL || process.env.WEBHOOK_LIVE_URL;
    if (liveUrl) {
      // If URL already includes the full path, return as is
      if (liveUrl.includes('/api/chatwoot/webhooks/chatwoot')) {
        return liveUrl;
      }
      return `${liveUrl}/api/chatwoot/webhooks/chatwoot`;
    }
    // Fallback: try to construct from CLIENT_URL or API_URL
    const apiUrl = process.env.API_URL || process.env.CLIENT_URL;
    if (apiUrl) {
      return `${apiUrl}/api/chatwoot/webhooks/chatwoot`;
    }
    // Last resort: use current request origin (if available)
    return `/api/chatwoot/webhooks/chatwoot`;
  } else {
    // Local mode - use ngrok or localhost
    const localUrl = process.env.LOCAL_WEBHOOK_URL || process.env.WEBHOOK_LOCAL_URL;
    if (localUrl) {
      // If URL already includes the full path, return as is
      if (localUrl.includes('/api/chatwoot/webhooks/chatwoot')) {
        return localUrl;
      }
      return `${localUrl}/api/chatwoot/webhooks/chatwoot`;
    }
    // Try to get ngrok URL from utils endpoint
    try {
      const axios = (await import('axios')).default;
      const apiBaseUrl = process.env.API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiBaseUrl}/api/utils/ngrok-url`);
      if (response.data.success && response.data.data?.available && response.data.data?.webhookUrl) {
        // Extract base URL from ngrok URL and append our webhook path
        const ngrokBase = response.data.data.webhookUrl.replace('/api/webhooks/facebook', '');
        return `${ngrokBase}/api/chatwoot/webhooks/chatwoot`;
      }
    } catch (error) {
      console.error('Error fetching ngrok URL:', error);
    }
    // Fallback: use localhost
    const defaultLocal = process.env.API_URL || 'http://localhost:5001';
    return `${defaultLocal}/api/chatwoot/webhooks/chatwoot`;
  }
}

/**
 * Get webhook URL for a specific integration
 * @param integrationId - Integration ID
 * @returns Webhook URL string
 */
export async function getIntegrationWebhookUrl(integrationId: number): Promise<string> {
  try {
    const { prisma } = await import('../lib/prisma.js');
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: { webhookMode: true, provider: true },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    if (integration.provider === 'chatwoot') {
      return await getChatwootWebhookUrl(
        (integration.webhookMode as WebhookMode) || WebhookMode.local,
        integrationId
      );
    }

    // For other providers, return appropriate URL
    return '';
  } catch (error) {
    console.error('Error getting integration webhook URL:', error);
    throw error;
  }
}

