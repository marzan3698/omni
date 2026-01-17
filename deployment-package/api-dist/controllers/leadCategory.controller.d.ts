import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const leadCategoryController: {
    createCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getCategories: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getCategoryById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=leadCategory.controller.d.ts.map