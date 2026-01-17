import { Request, Response } from 'express';
export declare const productCategoryController: {
    /**
     * Get all product categories
     * GET /api/product-categories?companyId=1
     */
    getAllCategories: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get product category by ID
     * GET /api/product-categories/:id?companyId=1
     */
    getCategoryById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create product category
     * POST /api/product-categories
     */
    createCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update product category
     * PUT /api/product-categories/:id?companyId=1
     */
    updateCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete product category
     * DELETE /api/product-categories/:id?companyId=1
     */
    deleteCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=productCategory.controller.d.ts.map