import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface LogActivityPayload {
  mouseClicks: number;
  mouseMovements: number;
  keystrokes: number;
  intervalStart: string;
  intervalEnd: string;
  sessionId?: number | null;
}

export const activityApi = {
  logActivity: (data: LogActivityPayload) =>
    apiClient.post<ApiResponse<{ ok: boolean }>>('/activity/log', data),

  uploadScreenshot: (formData: FormData) =>
    apiClient.post<ApiResponse<{ id: number }>>('/activity/screenshot', formData),

  getEmployeeSummaries: (date: string) =>
    apiClient.get<ApiResponse<EmployeeSummary[]>>(`/activity/employees?date=${date}`),

  getEmployeeDetail: (userId: string, date: string) =>
    apiClient.get<ApiResponse<EmployeeDetail>>(`/activity/employee/${userId}?date=${date}`),

  getEmployeeScreenshots: (userId: string, date: string, page: number) =>
    apiClient.get<ApiResponse<ScreenshotsPage>>(
      `/activity/employee/${userId}/screenshots?date=${date}&page=${page}`
    ),
};

export interface EmployeeSummary {
  userId: string;
  name: string | null;
  email: string;
  roleName: string;
  totalActiveMinutes: number;
  avgActivityScore: number;
  screenshotCount: number;
  isOnline: boolean;
}

export interface EmployeeDetail {
  user: { id: string; name: string | null; email: string; roleName: string };
  totalWorkMinutes: number;
  totalActiveMinutes: number;
  avgActivityScore: number;
  screenshotCount: number;
  activityByBlock: { blockStart: string; score: number; label: string }[];
  screenshots: { id: number; imageUrl: string; pageUrl: string | null; capturedAt: string }[];
}

export interface ScreenshotsPage {
  screenshots: { id: number; imageUrl: string; pageUrl: string | null; capturedAt: string }[];
  total: number;
  page: number;
  totalPages: number;
}
