import apiClient from './apiClient';
import type { ApiResponse, AuthResponse, LoginCredentials, RegisterData } from '@/types';

export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
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
      '/auth/register',
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
   * Register new client
   */
  async registerClient(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/register-client',
        { email, password }
      );
      
      if (response.data.success && response.data.data) {
        // Store token
        localStorage.setItem('token', response.data.data.token);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Registration failed');
    } catch (error: any) {
      // Handle axios errors
      if (error.response) {
        const message = error.response.data?.message || error.response.data?.error || 'Registration failed';
        throw new Error(message);
      } else if (error.request) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      } else {
        throw new Error(error.message || 'Registration failed');
      }
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/auth/me');
    
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

