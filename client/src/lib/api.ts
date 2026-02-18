import apiClientInstance from './apiClient';
import type { ApiResponse } from '@/types';

// Re-export apiClient for use in other files
export const apiClient = apiClientInstance;
export default apiClientInstance;

// Company API
export const companyApi = {
  getAll: (companyId?: number) => 
    apiClientInstance.get<ApiResponse>('/companies', { params: { companyId } }),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/companies/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/companies', data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/companies/${id}`, data),
  delete: (id: number) => apiClientInstance.delete<ApiResponse>(`/companies/${id}`),
  getContacts: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/companies/${id}/contacts`, { params: { companyId } }),
  getContracts: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/companies/${id}/contracts`, { params: { companyId } }),
};

// Employee API
export const employeeApi = {
  getAll: (companyId: number) => 
    apiClientInstance.get<ApiResponse>('/employees', { params: { companyId } }),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/employees/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/employees', data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/employees/${id}`, data),
  delete: (id: number, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/employees/${id}`, { params: { companyId } }),
  getTasks: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/employees/${id}/tasks`, { params: { companyId } }),
  getMyBalancePoints: () => 
    apiClientInstance.get<ApiResponse>('/employees/me/balance-points'),
};

// Task API
export const taskApi = {
  getAll: (companyId: number, filters?: any) => 
    apiClientInstance.get<ApiResponse>('/tasks', { params: { companyId, ...filters } }),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/tasks/${id}`, { params: { companyId } }),
  getDetail: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/tasks/${id}/detail`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/tasks', data),
  update: (id: number, data: any, companyId?: number) => 
    apiClientInstance.put<ApiResponse>(`/tasks/${id}`, data, { params: { companyId: companyId || data.companyId } }),
  delete: (id: number, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/tasks/${id}`, { params: { companyId } }),
  updateStatus: (id: number, status: string, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/tasks/${id}/status`, { status }, { params: { companyId } }),
  getUserTasks: (userId: string, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/tasks/user/${userId}`, { params: { companyId } }),
  assignToUser: (taskId: number, employeeId: number, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/tasks/${taskId}/assign`, { employeeId }, { params: { companyId } }),
  
  // Sub-task methods
  getSubTasks: (taskId: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/tasks/${taskId}/sub-tasks`, { params: { companyId } }),
  createSubTask: (taskId: number, data: any, companyId: number) => 
    apiClientInstance.post<ApiResponse>(`/tasks/${taskId}/sub-tasks`, { ...data, companyId }),
  updateSubTask: (id: number, data: any, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/tasks/sub-tasks/${id}`, { ...data, companyId }),
  deleteSubTask: (id: number, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/tasks/sub-tasks/${id}`, { params: { companyId } }),
  
  // Attachment methods
  uploadAttachment: (taskId: number, file: File, companyId: number, subTaskId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId.toString());
    formData.append('companyId', companyId.toString());
    if (subTaskId) {
      formData.append('subTaskId', subTaskId.toString());
    }
    return apiClientInstance.post<ApiResponse>(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  addLinkAttachment: (data: any) => 
    apiClientInstance.post<ApiResponse>('/tasks/attachments/link', data),
  deleteAttachment: (id: number, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/tasks/attachments/${id}`, { params: { companyId } }),
  
  // Audio upload
  uploadAudio: (taskId: number, audioBlob: Blob, mimeType: string, duration: number, companyId: number, subTaskId?: number) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('taskId', taskId.toString());
    formData.append('companyId', companyId.toString());
    formData.append('mimeType', mimeType);
    formData.append('duration', duration.toString());
    if (subTaskId) {
      formData.append('subTaskId', subTaskId.toString());
    }
    return apiClientInstance.post<ApiResponse>('/tasks/audio/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Conversation and message methods
  getMessages: (taskId: number, companyId: number, page: number = 1, limit: number = 50) => 
    apiClientInstance.get<ApiResponse>(`/tasks/${taskId}/messages`, { params: { companyId, page, limit } }),
  sendMessage: (taskId: number, data: any, companyId: number) => 
    apiClientInstance.post<ApiResponse>(`/tasks/${taskId}/messages`, { ...data, companyId }),
  markMessageAsRead: (messageId: number, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/tasks/messages/${messageId}/read`, {}, { params: { companyId } }),
  getUnreadCount: (taskId: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/tasks/${taskId}/messages/unread-count`, { params: { companyId } }),
};

// Finance API
export const financeApi = {
  invoices: {
    getAll: (companyId: number, filters?: any) => 
      apiClientInstance.get<ApiResponse>('/finance/invoices', { params: { companyId, ...filters } }),
    getById: (id: number, companyId: number) => 
      apiClientInstance.get<ApiResponse>(`/finance/invoices/${id}`, { params: { companyId } }),
    create: (data: any) => apiClientInstance.post<ApiResponse>('/finance/invoices', data),
    createFromProject: (data: {
      projectId: number;
      items: Array<{ description: string; quantity: number; unitPrice: number; productId?: number }>;
      issueDate?: string;
      dueDate?: string;
      notes?: string;
    }) => apiClientInstance.post<ApiResponse>('/finance/invoices/from-project', data),
    renew: (id: number) => apiClientInstance.post<ApiResponse>(`/finance/invoices/${id}/renew`),
    update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/finance/invoices/${id}`, data),
  },
  transactions: {
    getAll: (companyId: number, filters?: any) => 
      apiClientInstance.get<ApiResponse>('/finance/transactions', { params: { companyId, ...filters } }),
    create: (data: any) => apiClientInstance.post<ApiResponse>('/finance/transactions', data),
  },
  budgets: {
    getAll: (companyId: number) => 
      apiClientInstance.get<ApiResponse>('/finance/budgets', { params: { companyId } }),
    create: (data: any) => apiClientInstance.post<ApiResponse>('/finance/budgets', data),
  },
  summary: (companyId: number, startDate?: string, endDate?: string) => 
    apiClientInstance.get<ApiResponse>('/finance/transactions/summary', { params: { companyId, startDate, endDate } }),
};

// Client approval (pending clients – Finance)
export const clientApprovalApi = {
  getPending: () =>
    apiClientInstance.get<ApiResponse>('/client-approvals/pending'),
  approve: (id: number) =>
    apiClientInstance.post<ApiResponse>(`/client-approvals/${id}/approve`),
};

// Lead API
export const leadApi = {
  getAll: (filters?: any) => 
    apiClientInstance.get<ApiResponse>('/leads', { params: filters }),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/leads/${id}`, { params: { companyId } }),
  getLeadManagers: () =>
    apiClientInstance.get<ApiResponse>('/leads/lead-managers'),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/leads', data),
  createFromInbox: (conversationId: number, data: any) => 
    apiClientInstance.post<ApiResponse>(`/leads/from-inbox/${conversationId}`, data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/leads/${id}`, data),
  updateStatus: (id: number, status: string, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/leads/${id}/status`, { status }, { params: { companyId } }),
  transferMonitoring: (id: number, newLeadManagerUserId: string) =>
    apiClientInstance.put<ApiResponse>(`/leads/${id}/monitoring/transfer`, { newLeadManagerUserId }),
  assignUsers: (id: number, employeeIds: number[], companyId: number) =>
    apiClientInstance.post<ApiResponse>(`/leads/${id}/assign`, { employeeIds }, { params: { companyId } }),
  removeAssignment: (id: number, employeeId: number, companyId: number) =>
    apiClientInstance.delete<ApiResponse>(`/leads/${id}/assign/${employeeId}`, { params: { companyId } }),
  convert: (id: number, companyId: number, data?: any) => 
    apiClientInstance.post<ApiResponse>(`/leads/${id}/convert`, data, { params: { companyId } }),
  getPipeline: (companyId: number) => 
    apiClientInstance.get<ApiResponse>('/leads/pipeline', { params: { companyId } }),
  getMeetings: (leadId: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/leads/${leadId}/meetings`, { params: { companyId } }),
  createMeeting: (leadId: number, data: any, companyId: number) =>
    apiClientInstance.post<ApiResponse>(`/leads/${leadId}/meetings`, data, { params: { companyId } }),
  updateMeeting: (leadId: number, meetingId: number, data: any, companyId: number) =>
    apiClientInstance.put<ApiResponse>(`/leads/${leadId}/meetings/${meetingId}`, data, { params: { companyId } }),
  deleteMeeting: (leadId: number, meetingId: number, companyId: number) =>
    apiClientInstance.delete<ApiResponse>(`/leads/${leadId}/meetings/${meetingId}`, { params: { companyId } }),
  getCalls: (leadId: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/leads/${leadId}/calls`, { params: { companyId } }),
  createCall: (leadId: number, data: any, companyId: number) =>
    apiClientInstance.post<ApiResponse>(`/leads/${leadId}/calls`, data, { params: { companyId } }),
  updateCall: (leadId: number, callId: number, data: any, companyId: number) =>
    apiClientInstance.put<ApiResponse>(`/leads/${leadId}/calls/${callId}`, data, { params: { companyId } }),
  deleteCall: (leadId: number, callId: number, companyId: number) =>
    apiClientInstance.delete<ApiResponse>(`/leads/${leadId}/calls/${callId}`, { params: { companyId } }),
  addCallNote: (leadId: number, callId: number, note: string, companyId: number) =>
    apiClientInstance.post<ApiResponse>(`/leads/${leadId}/calls/${callId}/notes`, { note }, { params: { companyId } }),
};

// Meeting API
export const meetingApi = {
  getAll: (filters?: { status?: string; startDate?: string; endDate?: string; leadId?: number }) =>
    apiClientInstance.get<ApiResponse>('/meetings', { params: filters }),
  getUpcoming: () =>
    apiClientInstance.get<ApiResponse>('/meetings/upcoming'),
};

// Call API
export const callApi = {
  getAll: (filters?: { status?: string; startDate?: string; endDate?: string; leadId?: number; assignedTo?: number }) =>
    apiClientInstance.get<ApiResponse>('/calls', { params: filters }),
  getUpcoming: () =>
    apiClientInstance.get<ApiResponse>('/calls/upcoming'),
};

// Booking availability (for call/meeting conflict checks)
export const bookingApi = {
  getAvailability: (
    companyId: number,
    startTime: string,
    durationMinutes: number,
    options?: { excludeCallId?: number; excludeMeetingId?: number }
  ) =>
    apiClientInstance.get<ApiResponse>('/bookings/availability', {
      params: { companyId, startTime, durationMinutes, ...options },
    }),
};

// Lead Category API
export const leadCategoryApi = {
  getAll: () => 
    apiClientInstance.get<ApiResponse>('/lead-categories'),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/lead-categories/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/lead-categories', data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/lead-categories/${id}`, data),
  delete: (id: number, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/lead-categories/${id}`, { params: { companyId } }),
};

// Lead Interest API
export const leadInterestApi = {
  getAll: () => 
    apiClientInstance.get<ApiResponse>('/lead-interests'),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/lead-interests/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/lead-interests', data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/lead-interests/${id}`, data),
  delete: (id: number, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/lead-interests/${id}`, { params: { companyId } }),
};

// User API (SuperAdmin only)
export const userApi = {
  getAll: (companyId?: number) => 
    apiClientInstance.get<ApiResponse>('/users', { params: companyId ? { companyId } : {} }),
  getById: (id: string, companyId?: number) => 
    apiClientInstance.get<ApiResponse>(`/users/${id}`, { params: companyId ? { companyId } : {} }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/users', data),
  update: (id: string, data: any) => apiClientInstance.put<ApiResponse>(`/users/${id}`, data),
  delete: (id: string, companyId?: number) => 
    apiClientInstance.delete<ApiResponse>(`/users/${id}`, { params: companyId ? { companyId } : {} }),
  /** Login as another user (SuperAdmin only). Returns { user, token }. Store token and redirect. */
  loginAsUser: (userId: string) =>
    apiClientInstance.post<ApiResponse<{ user: any; token: string }>>(`/auth/login-as/${userId}`),
};

// System Settings API (SuperAdmin only)
export const systemSettingApi = {
  getAll: (companyId: number) => 
    apiClientInstance.get<ApiResponse>('/system-settings', { params: { companyId } }),
  getByKey: (key: string, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/system-settings/${key}`, { params: { companyId } }),
  upsert: (data: any) => apiClientInstance.post<ApiResponse>('/system-settings', data),
  update: (key: string, data: any) => apiClientInstance.put<ApiResponse>(`/system-settings/${key}`, data),
  delete: (key: string, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/system-settings/${key}`, { params: { companyId } }),
};

// Theme API (SuperAdmin only)
export const themeApi = {
  getThemeSettings: () => apiClientInstance.get<ApiResponse>('/theme/settings'),
  updateThemeSettings: (data: {
    siteName?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
  }) => apiClientInstance.post<ApiResponse>('/theme/settings', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClientInstance.post<ApiResponse>('/theme/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Hero API (SuperAdmin only)
export const heroApi = {
  getHeroSettings: () => apiClientInstance.get<ApiResponse>('/theme/hero/settings'),
  updateHeroSettings: (data: {
    title?: string;
    subtitle?: string;
    trustIndicator?: string;
    backgroundType?: 'image' | 'video_youtube' | 'video_local' | 'gradient';
    backgroundVideoYoutube?: string;
    ctaPrimaryText?: string;
    ctaSecondaryText?: string;
    buttonStyle?: 'solid' | 'outline' | 'gradient' | 'pill' | 'soft-shadow';
    buttonPrimaryColor?: string;
    buttonPrimaryTextColor?: string;
    buttonSecondaryColor?: string;
    buttonSecondaryTextColor?: string;
    titleColor?: string;
    subtitleColor?: string;
    trustIndicatorColor?: string;
    overlayColor?: string;
    overlayOpacity?: number;
    textAlignment?: 'left' | 'center' | 'right';
    featureHighlight1?: string;
    featureHighlight2?: string;
    featureHighlight3?: string;
    featureHighlightsAlignment?: 'left' | 'center' | 'right';
    buttonSize?: 'sm' | 'md' | 'lg' | 'xl';
    buttonPrimaryIcon?: string;
    buttonSecondaryIcon?: string;
    addonImage?: string;
    addonImageAlignment?: 'left' | 'center' | 'right';
  }) => apiClientInstance.post<ApiResponse>('/theme/hero/settings', data),
  uploadHeroImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClientInstance.post<ApiResponse>('/theme/hero/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadHeroVideo: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return apiClientInstance.post<ApiResponse>('/theme/hero/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadHeroAddonImage: (file: File) => {
    const formData = new FormData();
    formData.append('addonImage', file);
    return apiClientInstance.post<ApiResponse>('/theme/hero/addon-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Header API
export const headerApi = {
  getHeaderSettings: () => apiClientInstance.get<ApiResponse>('/theme/header/settings'),
  updateHeaderSettings: (data: {
    menuAbout?: string;
    menuServices?: string;
    menuContact?: string;
    menuTerms?: string;
    menuPrivacy?: string;
    menuSitemap?: string;
    buttonPrimaryText?: string;
    buttonSecondaryText?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    buttonSecondaryBgColor?: string;
    buttonSecondaryTextColor?: string;
    isFixed?: boolean;
    isTransparent?: boolean;
    logo?: string;
    logoType?: 'wide' | 'with-text';
  }) => apiClientInstance.post<ApiResponse>('/theme/header/settings', data),
  uploadHeaderLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClientInstance.post<ApiResponse>('/theme/header/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Color API
export const colorApi = {
  getColorSettings: () => apiClientInstance.get<ApiResponse>('/theme/colors'),
  updateColorSettings: (data: {
    primaryColor: string;
    secondaryColor: string;
  }) => apiClientInstance.post<ApiResponse>('/theme/colors', data),
};

// Role API (SuperAdmin only)
export const roleApi = {
  getAll: () => apiClientInstance.get<ApiResponse>('/roles'),
  getById: (id: number) => apiClientInstance.get<ApiResponse>(`/roles/${id}`),
  create: (name: string, permissions: Record<string, boolean>) =>
    apiClientInstance.post<ApiResponse>('/roles', { name, permissions }),
  updateName: (id: number, name: string) =>
    apiClientInstance.put<ApiResponse>(`/roles/${id}`, { name }),
  updatePermissions: (id: number, permissions: Record<string, boolean>) => 
    apiClientInstance.put<ApiResponse>(`/roles/${id}/permissions`, { permissions }),
  delete: (id: number) =>
    apiClientInstance.delete<ApiResponse>(`/roles/${id}`),
};

// Campaign API (SuperAdmin only)
export const campaignApi = {
  getAll: (companyId: number, filters?: { type?: string; active?: boolean }) => 
    apiClientInstance.get<ApiResponse>('/campaigns', { params: { companyId, ...filters } }),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/campaigns/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/campaigns', data),
  update: (id: number, data: any, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/campaigns/${id}`, data, { params: { companyId } }),
  delete: (id: number, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/campaigns/${id}`, { params: { companyId } }),
  getStatistics: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/campaigns/${id}/statistics`, { params: { companyId } }),
  getActive: (companyId: number) =>
    apiClientInstance.get<ApiResponse>('/campaigns/active', { params: { companyId } }),
  getProducts: (campaignId: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/campaigns/${campaignId}/products`, { params: { companyId } }),
  getGroups: (campaignId: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/campaigns/${campaignId}/groups`, { params: { companyId } }),
};

// Employee Group API
export const employeeGroupApi = {
  getAll: (companyId: number) =>
    apiClientInstance.get<ApiResponse>('/employee-groups', { params: { companyId } }),
  getById: (id: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/employee-groups/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/employee-groups', data),
  update: (id: number, data: any, companyId: number) =>
    apiClientInstance.put<ApiResponse>(`/employee-groups/${id}`, data, { params: { companyId } }),
  delete: (id: number, companyId: number) =>
    apiClientInstance.delete<ApiResponse>(`/employee-groups/${id}`, { params: { companyId } }),
  getMembers: (id: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/employee-groups/${id}/members`, { params: { companyId } }),
};

// Product API
export const productApi = {
  // List products - for all authenticated users (lead creation, etc.)
  list: (companyId: number, filters?: { categoryId?: number; search?: string }) =>
    apiClientInstance.get<ApiResponse>('/products/list', { params: { companyId, ...filters } }),
  // Get all products - requires can_manage_products permission
  getAll: (companyId: number, filters?: { categoryId?: number; search?: string }) =>
    apiClientInstance.get<ApiResponse>('/products', { params: { companyId, ...filters } }),
  getById: (id: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/products/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/products', data),
  update: (id: number, data: any, companyId: number) =>
    apiClientInstance.put<ApiResponse>(`/products/${id}`, data, { params: { companyId } }),
  delete: (id: number, companyId: number) =>
    apiClientInstance.delete<ApiResponse>(`/products/${id}`, { params: { companyId } }),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClientInstance.post<ApiResponse>('/products/upload-image', formData);
  },
};

// Product Category API
export const productCategoryApi = {
  getAll: (companyId: number) =>
    apiClientInstance.get<ApiResponse>('/product-categories', { params: { companyId } }),
  getById: (id: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/product-categories/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/product-categories', data),
  update: (id: number, data: any, companyId: number) =>
    apiClientInstance.put<ApiResponse>(`/product-categories/${id}`, data, { params: { companyId } }),
  delete: (id: number, companyId: number) =>
    apiClientInstance.delete<ApiResponse>(`/product-categories/${id}`, { params: { companyId } }),
};

// Service Category API
export const serviceCategoryApi = {
  /** Get all categories for client dashboard - uses auth user's companyId, no permission required */
  getListForClient: () =>
    apiClientInstance.get<ApiResponse>('/service-categories/list'),
  getAll: (companyId: number, parentId?: number | null) =>
    apiClientInstance.get<ApiResponse>('/service-categories', {
      params: { companyId, ...(parentId !== undefined && { parentId: parentId ?? 'null' }) },
    }),
  getById: (id: number, companyId: number) =>
    apiClientInstance.get<ApiResponse>(`/service-categories/${id}`, { params: { companyId } }),
  create: (data: { name: string; parentId?: number | null; description?: string; iconName?: string; iconUrl?: string }) =>
    apiClientInstance.post<ApiResponse>('/service-categories', data),
  update: (id: number, data: { name?: string; parentId?: number | null; description?: string; iconName?: string | null; iconUrl?: string | null }, companyId: number) =>
    apiClientInstance.put<ApiResponse>(`/service-categories/${id}`, data, { params: { companyId } }),
  delete: (id: number, companyId: number) =>
    apiClientInstance.delete<ApiResponse>(`/service-categories/${id}`, { params: { companyId } }),
  uploadIcon: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('icon', file);
    return apiClientInstance.post<ApiResponse>(`/service-categories/${id}/upload-icon`, formData);
  },
};

// Project API
export const projectApi = {
  getAll: () => apiClientInstance.get<ApiResponse>('/projects'),
  getById: (id: number) => apiClientInstance.get<ApiResponse>(`/projects/${id}`),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/projects', data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/projects/${id}`, data),
  sign: (id: number, signature: string) =>
    apiClientInstance.post<ApiResponse>(`/projects/${id}/sign`, { signature }),
  getStats: () => apiClientInstance.get<ApiResponse>('/projects/stats'),
};

// Client Leads API
export const clientLeadsApi = {
  getAll: (campaignId?: number) =>
    apiClientInstance.get<ApiResponse>('/leads/client', {
      params: campaignId ? { campaignId } : {},
    }),
};

// Client Campaigns API
export const clientCampaignsApi = {
  getMyCampaigns: () => apiClientInstance.get<ApiResponse>('/campaigns/client'),
};

// Service API
export const serviceApi = {
  getAll: (isActive?: boolean) =>
    apiClientInstance.get<ApiResponse>('/services', {
      params: isActive !== undefined ? { isActive } : {},
    }),
  getById: (id: number) => apiClientInstance.get<ApiResponse>(`/services/${id}`),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/services', data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/services/${id}`, data),
  delete: (id: number) => apiClientInstance.delete<ApiResponse>(`/services/${id}`),
};

// Admin API
export const adminApi = {
  getLiveUsers: () => apiClientInstance.get<ApiResponse>('/admin/live-users'),
  getLiveUserDetail: (userId: string) =>
    apiClientInstance.get<ApiResponse>(`/admin/live-users/${userId}/detail`),
  getClientUsers: () => apiClientInstance.get<ApiResponse>('/admin/client-users'),
  getAllProjects: (filters?: { companyId?: number; status?: string; search?: string }) =>
    apiClientInstance.get<ApiResponse>('/admin/projects', { params: filters }),
  getProjectById: (id: number) =>
    apiClientInstance.get<ApiResponse>(`/admin/projects/${id}`),
  createProject: (data: {
    clientId: string;
    serviceId: number;
    title?: string;
    description?: string;
    budget: number;
    time: string;
    deliveryStartDate?: string;
    deliveryEndDate?: string;
  }) => apiClientInstance.post<ApiResponse>('/admin/projects', data),
  getAllClients: (filters?: { companyId?: number; search?: string }) =>
    apiClientInstance.get<ApiResponse>('/admin/clients', { params: filters }),
  getClientById: (id: number) =>
    apiClientInstance.get<ApiResponse>(`/admin/clients/${id}`),
  updateProject: (id: number, data: any) =>
    apiClientInstance.put<ApiResponse>(`/admin/projects/${id}`, data),
  deleteProject: (id: number) => apiClientInstance.delete<ApiResponse>(`/admin/projects/${id}`),
  updateClient: (id: number, data: any) =>
    apiClientInstance.put<ApiResponse>(`/admin/clients/${id}`, data),
  deleteClient: (id: number) => apiClientInstance.delete<ApiResponse>(`/admin/clients/${id}`),
};

// Invoice API
export const invoiceApi = {
  getAll: (filters?: { companyId?: number; status?: string; clientId?: number }) =>
    apiClientInstance.get<ApiResponse>('/finance/invoices', { params: filters }),
  getById: (id: number) => apiClientInstance.get<ApiResponse>(`/finance/invoices/${id}`),
  getClientInvoices: () => apiClientInstance.get<ApiResponse>('/finance/invoices/client'),
  renew: (id: number) => apiClientInstance.post<ApiResponse>(`/finance/invoices/${id}/renew`),
  getPdf: (id: number, companyId?: number) =>
    apiClientInstance.get<Blob>(`/finance/invoices/${id}/pdf`, {
      params: companyId ? { companyId } : {},
      responseType: 'blob',
    }),
  getImage: (id: number, companyId?: number) =>
    apiClientInstance.get<Blob>(`/finance/invoices/${id}/image`, {
      params: companyId ? { companyId } : {},
      responseType: 'blob',
    }),
};

// Payment Gateway API
export const paymentGatewayApi = {
  getAll: () => apiClientInstance.get<ApiResponse>('/payment-gateways'),
  getActive: () => apiClientInstance.get<ApiResponse>('/payment-gateways/active'),
  getById: (id: number) => apiClientInstance.get<ApiResponse>(`/payment-gateways/${id}`),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/payment-gateways', data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/payment-gateways/${id}`, data),
  delete: (id: number) => apiClientInstance.delete<ApiResponse>(`/payment-gateways/${id}`),
};

// Payment API
export const paymentApi = {
  create: (data: any) => apiClientInstance.post<ApiResponse>('/payments', data),
  getByInvoice: (invoiceId: number) => apiClientInstance.get<ApiResponse>(`/payments/invoice/${invoiceId}`),
  getClientPayments: () => apiClientInstance.get<ApiResponse>('/payments/client'),
  getAll: (filters?: { status?: string; clientId?: number }) =>
    apiClientInstance.get<ApiResponse>('/payments', { params: filters }),
  getById: (id: number) => apiClientInstance.get<ApiResponse>(`/payments/${id}`),
  approve: (id: number, data?: { adminNotes?: string }) =>
    apiClientInstance.put<ApiResponse>(`/payments/${id}/approve`, data),
  reject: (id: number, data: { adminNotes: string }) =>
    apiClientInstance.put<ApiResponse>(`/payments/${id}/reject`, data),
};
