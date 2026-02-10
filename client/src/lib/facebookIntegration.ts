import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface FacebookConfig {
  appId: string;
  verifyToken: string;
  redirectUriOverride?: string | null;
  hasAppSecret: boolean;
}

export interface FacebookConfigUrls {
  webhookCallbackUrl: string;
  oauthRedirectUri: string;
  verifyToken: string;
  baseUrl?: string;
  source?: string;
  ngrokDomain?: string | null;
  isNgrokRunning?: boolean;
  _debug?: {
    ngrokAttempted?: boolean;
    ngrokSuccess?: boolean;
    ngrokError?: string;
    host?: string;
    isLocalhost?: boolean;
  };
}

export interface FacebookPageOption {
  id: string;
  name: string;
}

export const facebookIntegrationApi = {
  getConnectUrl: () =>
    apiClient.get<ApiResponse<{ url: string }>>('/integrations/facebook/connect-url'),

  getConnectSessionPages: (connectSessionId: string) =>
    apiClient.get<ApiResponse<FacebookPageOption[]>>(
      `/integrations/facebook/connect-session/${connectSessionId}/pages`
    ),

  connectPages: (connectSessionId: string, pageIds: string[]) =>
    apiClient.post<ApiResponse<unknown[]>>('/integrations/facebook/connect', {
      connectSessionId,
      pageIds,
    }),

  getConfig: (companyId?: number) => {
    const params = companyId != null ? { companyId } : {};
    return apiClient.get<ApiResponse<FacebookConfig | null>>('/facebook/config', { params });
  },

  updateConfig: (data: { appId: string; appSecret: string; verifyToken: string; redirectUriOverride?: string }, companyId?: number) => {
    const params = companyId != null ? { companyId } : {};
    return apiClient.put<ApiResponse<null>>('/facebook/config', data, { params });
  },

  getConfigUrls: (companyId?: number) => {
    const params = companyId != null ? { companyId } : {};
    return apiClient.get<ApiResponse<FacebookConfigUrls>>('/facebook/config/urls', { params });
  },

  getDiagnostics: (pageId: string) =>
    apiClient.get<ApiResponse<{ found: boolean; steps: Array<{ step: string; ok: boolean; message?: string }> }>>(
      `/integrations/facebook/pages/${pageId}/diagnostics`
    ),

  sendTestMessage: (pageId: string) =>
    apiClient.post<ApiResponse<{ conversationId: number; message: string }>>(
      `/integrations/facebook/pages/${pageId}/test-message`
    ),

  disconnectPage: (integrationId: number) =>
    apiClient.delete<ApiResponse<null>>(`/integrations/facebook/pages/${integrationId}/disconnect`),
};
