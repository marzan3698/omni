import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const systemSettingController: {
    upsertSetting: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getSettings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getSettingByKey: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateSetting: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteSetting: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=systemSetting.controller.d.ts.map