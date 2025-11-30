import { Request } from 'express';

// Extend Express Request to include user info after authentication
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: number;
    companyId: number;
    role?: {
      name: string;
    };
  };
}

// Standard API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Error Response type
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

