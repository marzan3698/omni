import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface SlotInfo {
  slotId: string;
  connected: boolean;
  phoneNumber?: string;
}

export const whatsappApi = {
  connect: (slotId: string) =>
    apiClient.post<ApiResponse<{ status: string; slotId?: string }>>(`/whatsapp/connect/${slotId}`),
  disconnect: (slotId: string) =>
    apiClient.post<ApiResponse>(`/whatsapp/disconnect/${slotId}`),
  getStatus: (slotId: string) =>
    apiClient.get<ApiResponse<{ connected: boolean; slotId?: string }>>(`/whatsapp/status/${slotId}`),
  listSlots: () =>
    apiClient.get<ApiResponse<SlotInfo[]>>('/whatsapp/slots'),
  sendMessage: (to: string, content: string, slotId?: string) =>
    apiClient.post<ApiResponse<{ messageId?: string }>>('/whatsapp/send', {
      to,
      content,
      ...(slotId ? { slotId } : {}),
    }),
};
