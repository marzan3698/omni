import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to verify JWT token and attach user to request
 */
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if user has required role(s)
 * Usage: verifyRole(['Admin', 'Manager'])
 */
export declare const verifyRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if user has specific permission
 * Usage: verifyPermission('can_delete_users')
 */
export declare const verifyPermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to check if user can view tasks
 * Allows users to view their own tasks OR users with can_view_tasks permission
 * Also allows users assigned to a specific task (individually or via group) to access it
 * Usage: verifyTaskViewAccess
 */
export declare const verifyTaskViewAccess: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to check if user can update tasks
 * Allows users to update their own assigned tasks (status only) OR users with can_manage_tasks permission
 * Usage: verifyTaskUpdateAccess
 */
export declare const verifyTaskUpdateAccess: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to check if user can access a lead
 * Allows users with can_manage_leads permission OR users with assigned calls for that lead
 * Usage: verifyLeadAccess
 */
export declare const verifyLeadAccess: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export { authMiddleware as default };
//# sourceMappingURL=authMiddleware.d.ts.map