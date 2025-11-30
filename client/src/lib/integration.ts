import apiClient from './api';
import type { ApiResponse } from '@/types';

export interface Integration {
  id: number;
  provider: 'facebook' | 'whatsapp' | 'chatwoot';
  pageId: string;
  accessToken: string;
  accountId?: string | null;
  baseUrl?: string | null;
  isActive: boolean;
  webhookMode?: 'local' | 'live' | null;
  isWebhookActive?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationData {
  provider: 'facebook' | 'whatsapp' | 'chatwoot';
  pageId: string;
  accessToken: string;
  accountId?: string;
  baseUrl?: string;
  isActive?: boolean;
  webhookMode?: 'local' | 'live';
  isWebhookActive?: boolean;
}

export interface UpdateIntegrationData {
  pageId?: string;
  accessToken?: string;
  accountId?: string;
  baseUrl?: string;
  isActive?: boolean;
}

export const integrationApi = {
  /**
   * Get all integrations
   */
  async getIntegrations(): Promise<Integration[]> {
    const response = await apiClient.get<ApiResponse<Integration[]>>('/integrations');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch integrations');
  },

  /**
   * Get integration by ID
   */
  async getIntegrationById(id: number): Promise<Integration> {
    const response = await apiClient.get<ApiResponse<Integration>>(`/integrations/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch integration');
  },

  /**
   * Create or update integration
   */
  async upsertIntegration(data: CreateIntegrationData): Promise<Integration> {
    const response = await apiClient.post<ApiResponse<Integration>>('/integrations', data);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to save integration');
  },

  /**
   * Update integration
   */
  async updateIntegration(id: number, data: UpdateIntegrationData): Promise<Integration> {
    const response = await apiClient.put<ApiResponse<Integration>>(`/integrations/${id}`, data);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to update integration');
  },

  /**
   * Delete integration
   */
  async deleteIntegration(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/integrations/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete integration');
    }
  },

  /**
   * Sync Chatwoot conversations
   */
  async syncChatwootConversations(integrationId?: number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/chatwoot/sync', {
      integrationId,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to sync Chatwoot conversations');
  },

  /**
   * Get Chatwoot webhook URL
   */
  async getChatwootWebhookUrl(integrationId?: number): Promise<string> {
    const params = integrationId ? `?integrationId=${integrationId}` : '';
    const response = await apiClient.get<ApiResponse<{ webhookUrl: string }>>(
      `/utils/chatwoot-webhook-url${params}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data.webhookUrl;
    }

    throw new Error(response.data.message || 'Failed to get webhook URL');
  },
};

