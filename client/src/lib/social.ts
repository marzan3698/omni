import apiClient from './api';
import type { ApiResponse } from '@/types';

export interface SocialConversation {
  id: number;
  platform: 'facebook' | 'chatwoot';
  externalUserId: string;
  externalUserName: string | null;
  status: 'Open' | 'Closed';
  lastMessageAt: string | null;
  createdAt: string;
  messages?: SocialMessage[];
  _count?: {
    messages: number;
  };
}

export interface SocialMessage {
  id: number;
  conversationId: number;
  senderType: 'customer' | 'agent';
  content: string;
  createdAt: string;
}

export interface ConversationAnalytics {
  totalConversations: number;
  openConversations: number;
  closedConversations: number;
  platformBreakdown: {
    facebook: number;
    chatwoot: number;
    other: number;
  };
  daily: Array<{
    date: string;
    messages: number;
    conversations: number;
  }>;
}

export const socialApi = {
  /**
   * Get all conversations
   */
  async getConversations(status?: 'Open' | 'Closed'): Promise<SocialConversation[]> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get<ApiResponse<SocialConversation[]>>(
      `/conversations${params}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch conversations');
  },

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: number): Promise<SocialConversation> {
    const response = await apiClient.get<ApiResponse<SocialConversation>>(
      `/conversations/${conversationId}/messages`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch messages');
  },

  /**
   * Send a reply message
   */
  async sendReply(conversationId: number, content: string): Promise<SocialMessage> {
    const response = await apiClient.post<ApiResponse<SocialMessage>>(
      `/conversations/${conversationId}/reply`,
      { content }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to send message');
  },

  /**
   * Get conversation analytics
   */
  async getAnalytics(days = 30): Promise<ConversationAnalytics> {
    const response = await apiClient.get<ApiResponse<ConversationAnalytics>>(
      `/conversations/analytics?days=${days}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch analytics');
  },

  async getPublicAnalytics(days = 30, companyId?: number): Promise<ConversationAnalytics> {
    const params = new URLSearchParams();
    params.set('days', String(days));
    if (companyId) params.set('companyId', String(companyId));
    const response = await apiClient.get<ApiResponse<ConversationAnalytics>>(
      `/conversations/analytics/public?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch analytics');
  },
};

