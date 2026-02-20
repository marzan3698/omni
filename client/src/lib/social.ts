import apiClient from './api';
import type { ApiResponse } from '@/types';

export interface ConversationLabel {
  id: number;
  conversationId: number;
  name: string;
  source?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialConversation {
  id: number;
  platform: 'facebook' | 'whatsapp';
  externalUserId: string;
  externalUserName: string | null;
  status: 'Open' | 'Closed';
  lastMessageAt: string | null;
  assignedTo?: number | null;
  assignedAt?: string | null;
  whatsappSlotId?: string | null;
  facebookPageId?: string | null;
  facebookPageName?: string | null;
  // Chatwoot integration fields
  chatwootConversationId?: number | null;
  chatwootInboxName?: string | null;
  assignedEmployee?: {
    id: number;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  } | null;
  createdAt: string;
  messages?: SocialMessage[];
  labels?: ConversationLabel[];
  _count?: {
    messages: number;
    releases?: number; // Count of releases for this conversation
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
    whatsapp: number;
    other: number;
  };
  daily: Array<{
    date: string;
    messages: number;
    conversations: number;
  }>;
}

export interface AssignmentStats {
  totalConversations: number;
  whatsappCount: number;
  messengerCount: number;
  assignedToMe: number;
  totalCustomerCareReps: number;
  myShare: number;
}

export interface SuperAdminStats {
  totalMessages: number;
  assignedMessages: number;
  unassignedMessages: number;
  activeRepsCount: number;
}

export interface ConversationStats {
  totalAssigned: number;
  activeEmployees: Array<{
    id: number;
    name: string;
    email: string;
    assignedCount: number;
  }>;
  totalReleases: number;
  releasesByEmployee: Array<{
    employeeId: number;
    employeeName: string;
    releaseCount: number;
  }>;
}

export const socialApi = {
  /**
   * Get all conversations
   */
  async getConversations(tab?: 'inbox' | 'taken' | 'complete', status?: 'Open' | 'Closed'): Promise<SocialConversation[]> {
    const params = new URLSearchParams();
    if (tab) {
      params.set('tab', tab);
    }
    if (status) {
      params.set('status', status);
    }
    const queryString = params.toString();
    const url = queryString ? `/conversations?${queryString}` : '/conversations';
    const response = await apiClient.get<ApiResponse<SocialConversation[]>>(url);

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

  /**
   * Assign a conversation to current user (employee)
   */
  async assignConversation(conversationId: number): Promise<SocialConversation> {
    const response = await apiClient.post<ApiResponse<SocialConversation>>(
      `/conversations/${conversationId}/assign`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to assign conversation');
  },

  /**
   * Unassign a conversation (remove assignment)
   */
  async unassignConversation(conversationId: number): Promise<SocialConversation> {
    const response = await apiClient.post<ApiResponse<SocialConversation>>(
      `/conversations/${conversationId}/unassign`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to unassign conversation');
  },

  /**
   * Mark conversation as complete (status: 'Closed')
   */
  async completeConversation(conversationId: number): Promise<SocialConversation> {
    const response = await apiClient.post<ApiResponse<SocialConversation>>(
      `/conversations/${conversationId}/complete`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to complete conversation');
  },

  /**
   * Get assignment stats for Customer Care inbox (round-robin stats)
   */
  async getAssignmentStats(): Promise<AssignmentStats> {
    const response = await apiClient.get<ApiResponse<AssignmentStats>>(
      '/conversations/assignment-stats'
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch assignment stats');
  },

  /**
   * Get SuperAdmin inbox stats (total/assigned/unassigned, active reps).
   */
  async getSuperAdminStats(): Promise<SuperAdminStats> {
    const response = await apiClient.get<ApiResponse<SuperAdminStats>>(
      '/conversations/superadmin-stats'
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch SuperAdmin stats');
  },

  /**
   * Distribute N unassigned conversations to active Customer Care reps.
   */
  async distributeConversations(count: number): Promise<{ distributed: number; failed: number }> {
    const response = await apiClient.post<ApiResponse<{ distributed: number; failed: number }>>(
      '/conversations/distribute',
      { count }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to distribute conversations');
  },

  /**
   * Get conversation statistics (for dashboard)
   */
  async getConversationStats(): Promise<ConversationStats> {
    const response = await apiClient.get<ApiResponse<ConversationStats>>(
      '/conversations/stats'
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch conversation statistics');
  },

  /**
   * Get release history for a conversation
   */
  async getConversationReleaseHistory(conversationId: number): Promise<Array<{
    id: number;
    conversationId: number;
    employeeId: number;
    companyId: number;
    releasedAt: string;
    createdAt: string;
    employee: {
      id: number;
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    };
  }>> {
    const response = await apiClient.get<ApiResponse<Array<{
      id: number;
      conversationId: number;
      employeeId: number;
      companyId: number;
      releasedAt: string;
      createdAt: string;
      employee: {
        id: number;
        user: {
          id: string;
          name: string | null;
          email: string;
        };
      };
    }>>>(`/conversations/${conversationId}/releases`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch release history');
  },

  /**
   * Add a label to a conversation
   */
  async addLabel(conversationId: number, labelData: { name: string; source?: string | null }): Promise<ConversationLabel> {
    const response = await apiClient.post<ApiResponse<ConversationLabel>>(
      `/conversations/${conversationId}/labels`,
      labelData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to add label');
  },

  /**
   * Update a conversation label
   */
  async updateLabel(conversationId: number, labelId: number, labelData: { name?: string; source?: string | null }): Promise<ConversationLabel> {
    const response = await apiClient.put<ApiResponse<ConversationLabel>>(
      `/conversations/${conversationId}/labels/${labelId}`,
      labelData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to update label');
  },

  /**
   * Delete a conversation label
   */
  async deleteLabel(conversationId: number, labelId: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/conversations/${conversationId}/labels/${labelId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete label');
    }
  },

  /**
   * Get all labels for a conversation
   */
  async getConversationLabels(conversationId: number): Promise<ConversationLabel[]> {
    const response = await apiClient.get<ApiResponse<ConversationLabel[]>>(
      `/conversations/${conversationId}/labels`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch labels');
  },
};

