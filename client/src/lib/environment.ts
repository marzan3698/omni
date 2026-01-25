import apiClient from './api';
import type { ApiResponse } from '@/types';

export interface FacebookConfig {
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  FACEBOOK_VERIFY_TOKEN: string;
  FACEBOOK_OAUTH_REDIRECT_URI: string;
}

export const environmentApi = {
  /**
   * Get Facebook webhook configuration
   */
  async getFacebookConfig(): Promise<FacebookConfig> {
    const response = await apiClient.get<ApiResponse<FacebookConfig>>('/admin/environment/facebook-config');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch Facebook configuration');
  },

  /**
   * Update Facebook webhook configuration
   */
  async updateFacebookConfig(data: FacebookConfig): Promise<{ message: string; envPath: string }> {
    const response = await apiClient.put<ApiResponse<{ message: string; envPath: string }>>(
      '/admin/environment/facebook-config',
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to update Facebook configuration');
  },
};
