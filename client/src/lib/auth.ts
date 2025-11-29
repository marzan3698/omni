import apiClient from './api';
import type { ApiResponse, AuthResponse, LoginCredentials, RegisterData } from '@/types';

export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/login',
      credentials
    );
    
    if (response.data.success && response.data.data) {
      // Store token
      localStorage.setItem('token', response.data.data.token);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { confirmPassword, ...registerData } = data;
    
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/register',
      registerData
    );
    
    if (response.data.success && response.data.data) {
      // Store token
      localStorage.setItem('token', response.data.data.token);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/api/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get profile');
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};

