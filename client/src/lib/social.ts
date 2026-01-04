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
  unreadCount?: number;
}

export interface SocialMessage {
  id: number;
  conversationId: number;
  senderType: 'customer' | 'agent';
  content: string;
  imageUrl?: string | null;
  isRead?: boolean;
  readAt?: string | null;
  isSeen?: boolean;
  seenAt?: string | null;
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
   * @param conversationId - Conversation ID
   * @param content - Text content (optional if image is provided)
   * @param image - Optional image file
   */
  async sendReply(conversationId: number, content: string, image?: File): Promise<SocialMessage> {
    if (image) {
      // Use FormData for multipart upload
      const formData = new FormData();
      if (content) {
        formData.append('content', content);
      }
      formData.append('image', image);

      console.log('📤 Sending image message:', {
        conversationId,
        hasContent: !!content,
        imageName: image.name,
        imageSize: image.size,
        imageType: image.type,
      });

      const response = await apiClient.post<ApiResponse<SocialMessage>>(
        `/conversations/${conversationId}/reply`,
        formData
        // Note: Don't set Content-Type header - apiClient will handle it
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to send message');
    } else {
      // Regular JSON request for text-only messages
      const response = await apiClient.post<ApiResponse<SocialMessage>>(
        `/conversations/${conversationId}/reply`,
        { content }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to send message');
    }
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

  /**
   * Mark conversation messages as read
   */
  async markConversationAsRead(conversationId: number): Promise<void> {
    const response = await apiClient.post<ApiResponse<{ markedCount: number }>>(
      `/conversations/${conversationId}/mark-read`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark messages as read');
    }
  },

  /**
   * Mark a single message as read
   */
  async markMessageAsRead(conversationId: number, messageId: number): Promise<SocialMessage> {
    const response = await apiClient.post<ApiResponse<SocialMessage>>(
      `/conversations/${conversationId}/messages/${messageId}/mark-read`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to mark message as read');
  },

  /**
   * Update typing indicator status
   */
  async updateTypingStatus(conversationId: number, isTyping: boolean): Promise<void> {
    const response = await apiClient.post<ApiResponse<{ isTyping: boolean }>>(
      `/conversations/${conversationId}/typing`,
      { isTyping }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update typing status');
    }
  },

  /**
   * Get typing indicator status
   */
  async getTypingStatus(conversationId: number): Promise<{ isTyping: boolean; userId?: string }> {
    const response = await apiClient.get<ApiResponse<{ isTyping: boolean; userId?: string }>>(
      `/conversations/${conversationId}/typing`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch typing status');
  },
};

