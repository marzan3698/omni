// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  roleId: number;
  roleName?: string;
  profileImage?: string;
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  roleId?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

