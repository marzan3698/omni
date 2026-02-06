/**
 * Webhook URL Helper Utilities
 * Generates webhook URLs based on mode (local/live) and integration settings
 */

export enum WebhookMode {
  local = 'local',
  live = 'live',
}

/**
 * Get webhook URL for a specific integration
 * @param integrationId - Integration ID
 * @returns Webhook URL string (empty for providers that do not use this helper)
 */
export async function getIntegrationWebhookUrl(integrationId: number): Promise<string> {
  try {
    const { prisma } = await import('../lib/prisma.js');
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: { provider: true },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    // Facebook and WhatsApp use their own webhook setup; no generic URL from this helper
    return '';
  } catch (error) {
    console.error('Error getting integration webhook URL:', error);
    throw error;
  }
}
