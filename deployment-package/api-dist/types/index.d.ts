import { Request } from 'express';
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
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
export interface ErrorResponse {
    success: false;
    message: string;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map