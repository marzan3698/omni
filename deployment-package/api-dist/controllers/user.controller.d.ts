import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const userController: {
    getAllUsers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getUserById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    createUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=user.controller.d.ts.map