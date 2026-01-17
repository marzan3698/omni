import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const financeController: {
    getAllInvoices: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getInvoiceById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getClientInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    createInvoice: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateInvoice: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteInvoice: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAllTransactions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    createTransaction: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getFinancialSummary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAllBudgets: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    createBudget: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAllCategories: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    createCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAllPayables: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAllReceivables: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    createPayable: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    createReceivable: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=finance.controller.d.ts.map