/**
 * Webhook URL Helper Utilities
 * Generates webhook URLs based on mode (local/live) and integration settings
 */
export declare enum WebhookMode {
    local = "local",
    live = "live"
}
/**
 * Get webhook URL for Chatwoot integration
 * @param mode - 'local' or 'live'
 * @param integrationId - Optional integration ID to check stored mode
 * @returns Webhook URL string
 */
export declare function getChatwootWebhookUrl(mode?: WebhookMode, integrationId?: number): Promise<string>;
/**
 * Get webhook URL for a specific integration
 * @param integrationId - Integration ID
 * @returns Webhook URL string
 */
export declare function getIntegrationWebhookUrl(integrationId: number): Promise<string>;
//# sourceMappingURL=webhook.d.ts.map