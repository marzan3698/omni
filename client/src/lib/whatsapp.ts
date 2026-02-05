import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export const whatsappApi = {
  connect: () => apiClient.post<ApiResponse<{ status: string }>>('/whatsapp/connect'),
  disconnect: () => apiClient.post<ApiResponse>('/whatsapp/disconnect'),
  getStatus: () =>
    apiClient.get<ApiResponse<{ connected: boolean }>>('/whatsapp/status'),
  sendMessage: (to: string, content: string) =>
    apiClient.post<ApiResponse<{ messageId?: string }>>('/whatsapp/send', {
      to,
      content,
    }),
};
