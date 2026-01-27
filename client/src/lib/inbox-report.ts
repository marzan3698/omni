import apiClient from './api';
import type { ApiResponse } from '@/types';

export interface InboxReportFilters {
  startDate?: string;
  endDate?: string;
  labelName?: string;
}

export interface InboxReportSummary {
  totalConversations: number;
  totalUniqueUsers: number;
  totalMessages: number;
  openConversations: number;
  closedConversations: number;
}

export interface EmployeePerformance {
  employeeId: number;
  employeeName: string;
  email: string;
  assignedConversations: number;
  messagesHandled: number;
}

export interface LabelBreakdown {
  labelName: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  messages: number;
  conversations: number;
}

export interface InboxReportData {
  summary: InboxReportSummary;
  employeePerformance: EmployeePerformance[];
  labelBreakdown: LabelBreakdown[];
  dailyTrend: DailyTrend[];
}

export const inboxReportApi = {
  /**
   * Get inbox report data
   */
  async getInboxReport(filters?: InboxReportFilters): Promise<InboxReportData> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) {
      params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.set('endDate', filters.endDate);
    }
    if (filters?.labelName) {
      params.set('labelName', filters.labelName);
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/inbox-report?${queryString}` : '/admin/inbox-report';
    
    const response = await apiClient.get<ApiResponse<InboxReportData>>(url);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch inbox report');
    }
    
    return response.data.data!;
  },
};
