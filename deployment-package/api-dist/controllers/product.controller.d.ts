import { Request, Response } from 'express';
export declare const productController: {
    /**
     * Get all products
     * GET /api/products?companyId=1&categoryId=1&search=keyword
     */
    getAllProducts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get product by ID
     * GET /api/products/:id?companyId=1
     */
    getProductById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create product
     * POST /api/products
     */
    createProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update product
     * PUT /api/products/:id?companyId=1
     */
    updateProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete product
     * DELETE /api/products/:id?companyId=1
     */
    deleteProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Upload product image
     * POST /api/products/upload-image
     */
    uploadImage: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=product.controller.d.ts.map