import { Request, Response } from 'express';
export declare const employeeController: {
    /**
     * Get all employees
     * GET /api/employees?companyId=1
     */
    getAllEmployees: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get employee by ID
     * GET /api/employees/:id
     */
    getEmployeeById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create employee
     * POST /api/employees
     */
    createEmployee: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update employee
     * PUT /api/employees/:id
     */
    updateEmployee: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete employee
     * DELETE /api/employees/:id
     */
    deleteEmployee: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get employee tasks
     * GET /api/employees/:id/tasks
     */
    getEmployeeTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get employee performance
     * GET /api/employees/:id/performance
     */
    getEmployeePerformance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=employee.controller.d.ts.map