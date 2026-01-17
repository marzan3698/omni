import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const leadInterestController: {
    createInterest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getInterests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getInterestById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateInterest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteInterest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=leadInterest.controller.d.ts.map