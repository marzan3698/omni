import apiClient from './api';
import type { ApiResponse } from '@/types';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface OAuthUrlResponse {
  url: string;
  state: string;
}

export const facebookOAuthApi = {
  /**
   * Get OAuth authorization URL
   */
  async getAuthUrl(): Promise<OAuthUrlResponse> {
    const response = await apiClient.get<ApiResponse<OAuthUrlResponse>>(
      '/integrations/facebook/auth-url'
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get OAuth URL');
  },

  /**
   * Connect a Facebook page
   */
  async connectPage(pageId: string, pageName: string, pageAccessToken: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/integrations/facebook/connect-page', {
      pageId,
      pageName,
      pageAccessToken,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to connect page');
  },
};
