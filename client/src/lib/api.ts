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
};

// Task API
export const taskApi = {
  getAll: (companyId: number, filters?: any) => 
    apiClientInstance.get<ApiResponse>('/tasks', { params: { companyId, ...filters } }),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/tasks/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/tasks', data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/tasks/${id}`, data),
  delete: (id: number, companyId: number) => 
    apiClientInstance.delete<ApiResponse>(`/tasks/${id}`, { params: { companyId } }),
  updateStatus: (id: number, status: string, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/tasks/${id}/status`, { status }, { params: { companyId } }),
  getUserTasks: (userId: string, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/tasks/user/${userId}`, { params: { companyId } }),
  assignToUser: (taskId: number, employeeId: number, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/tasks/${taskId}/assign`, { employeeId }, { params: { companyId } }),
};

// Finance API
export const financeApi = {
  invoices: {
    getAll: (companyId: number, filters?: any) => 
      apiClientInstance.get<ApiResponse>('/finance/invoices', { params: { companyId, ...filters } }),
    getById: (id: number, companyId: number) => 
      apiClientInstance.get<ApiResponse>(`/finance/invoices/${id}`, { params: { companyId } }),
    create: (data: any) => apiClientInstance.post<ApiResponse>('/finance/invoices', data),
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

// Lead API
export const leadApi = {
  getAll: (filters?: any) => 
    apiClientInstance.get<ApiResponse>('/leads', { params: filters }),
  getById: (id: number, companyId: number) => 
    apiClientInstance.get<ApiResponse>(`/leads/${id}`, { params: { companyId } }),
  create: (data: any) => apiClientInstance.post<ApiResponse>('/leads', data),
  createFromInbox: (conversationId: number, data: any) => 
    apiClientInstance.post<ApiResponse>(`/leads/from-inbox/${conversationId}`, data),
  update: (id: number, data: any) => apiClientInstance.put<ApiResponse>(`/leads/${id}`, data),
  updateStatus: (id: number, status: string, companyId: number) => 
    apiClientInstance.put<ApiResponse>(`/leads/${id}/status`, { status }, { params: { companyId } }),
  convert: (id: number, companyId: number, data?: any) => 
    apiClientInstance.post<ApiResponse>(`/leads/${id}/convert`, data, { params: { companyId } }),
  getPipeline: (companyId: number) => 
    apiClientInstance.get<ApiResponse>('/leads/pipeline', { params: { companyId } }),
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

// Role API (SuperAdmin only)
export const roleApi = {
  getAll: () => apiClientInstance.get<ApiResponse>('/roles'),
  getById: (id: number) => apiClientInstance.get<ApiResponse>(`/roles/${id}`),
  updatePermissions: (id: number, permissions: Record<string, boolean>) => 
    apiClientInstance.put<ApiResponse>(`/roles/${id}/permissions`, { permissions }),
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
};

// Product API
export const productApi = {
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
