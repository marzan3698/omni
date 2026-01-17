import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const roleController: {
    getAllRoles: (_req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getRoleById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateRolePermissions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=role.controller.d.ts.map