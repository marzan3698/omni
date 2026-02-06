import apiClient from './api';
import type { ApiResponse } from '@/types';

export interface WorkSession {
  id: number;
  startTime: string;
  endTime: string | null;
  duration: number | null;
}

export interface CurrentSessionResponse {
  isOnline: boolean;
  session: WorkSession | null;
}

export interface WorkHistoryResponse {
  sessions: WorkSession[];
  totalDuration: number;
  dailyStats: { date: string; duration: number }[];
}

export const workSessionApi = {
  async toggleLiveStatus(): Promise<CurrentSessionResponse> {
    const response = await apiClient.post<ApiResponse<CurrentSessionResponse>>(
      '/work-session/toggle'
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to toggle live status');
  },

  async getCurrentSession(): Promise<CurrentSessionResponse> {
    const response = await apiClient.get<ApiResponse<CurrentSessionResponse>>(
      '/work-session/current'
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get current session');
  },

  async getWorkHistory(days: number = 7): Promise<WorkHistoryResponse> {
    const response = await apiClient.get<ApiResponse<WorkHistoryResponse>>(
      `/work-session/history?days=${days}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get work history');
  },
};
