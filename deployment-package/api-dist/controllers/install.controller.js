import { installService } from '../services/install.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import crypto from 'crypto';
// Validation schemas
const databaseConfigSchema = z.object({
    host: z.string().min(1, 'Database host is required'),
    port: z.number().int().positive().default(3306),
    database: z.string().min(1, 'Database name is required'),
    username: z.string().min(1, 'Database username is required'),
    password: z.string().min(1, 'Database password is required'),
});
const mysqlRootConfigSchema = z.object({
    host: z.string().min(1, 'MySQL host is required'),
    port: z.number().int().positive().default(3306),
    rootUsername: z.string().min(1, 'MySQL root username is required'),
    rootPassword: z.string().min(1, 'MySQL root password is required'),
});
const autoSetupConfigSchema = z.object({
    databaseName: z.string().min(1, 'Database name is required'),
    databaseUsername: z.string().min(1, 'Database username is required'),
    databasePassword: z.string().min(1, 'Database password is required'),
    mysqlRoot: mysqlRootConfigSchema.optional(),
    useExistingDatabase: z.boolean().optional().default(false),
    existingDatabaseConfig: databaseConfigSchema.optional(),
});
const adminUserSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    name: z.string().min(1, 'Admin name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});
export const installController = {
    /**
     * Check installation status
     * GET /api/install/status
     */
    checkStatus: async (req, res) => {
        try {
            const status = await installService.checkInstallationStatus();
            return sendSuccess(res, status, 'Installation status retrieved');
        }
        catch (error) {
            return sendError(res, error.message || 'Failed to check installation status', 500);
        }
    },
    /**
     * Check prerequisites
     * POST /api/install/check-prerequisites
     */
    checkPrerequisites: async (req, res) => {
        try {
            // Check if already installed
            const status = await installService.checkInstallationStatus();
            if (status.isInstalled) {
                throw new AppError('Application is already installed', 403);
            }
            const results = await installService.checkPrerequisites();
            return sendSuccess(res, results, 'Prerequisites check completed');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, error.message || 'Failed to check prerequisites', 500);
        }
    },
    /**
     * Test database connection
     * POST /api/install/test-database
     */
    testDatabase: async (req, res) => {
        try {
            // Check if already installed
            const status = await installService.checkInstallationStatus();
            if (status.isInstalled) {
                throw new AppError('Application is already installed', 403);
            }
            const validatedData = databaseConfigSchema.parse(req.body);
            const result = await installService.testDatabaseConnection(validatedData);
            if (result.success) {
                return sendSuccess(res, result, result.message);
            }
            else {
                return sendError(res, result.message, 400);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, error.message || 'Failed to test database connection', 500);
        }
    },
    /**
     * Setup database
     * POST /api/install/setup-database
     */
    setupDatabase: async (req, res) => {
        try {
            // Check if already installed
            const status = await installService.checkInstallationStatus();
            if (status.isInstalled) {
                throw new AppError('Application is already installed', 403);
            }
            const validatedData = databaseConfigSchema.parse(req.body);
            const result = await installService.setupDatabase(validatedData);
            if (result.success) {
                return sendSuccess(res, result, result.message);
            }
            else {
                return sendError(res, result.message, 500);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, error.message || 'Failed to setup database', 500);
        }
    },
    /**
     * Create admin user
     * POST /api/install/create-admin
     */
    createAdmin: async (req, res) => {
        try {
            // Check if already installed
            const status = await installService.checkInstallationStatus();
            if (status.isInstalled) {
                throw new AppError('Application is already installed', 403);
            }
            const validatedData = adminUserSchema.parse(req.body);
            const databaseConfig = req.body.databaseConfig ? databaseConfigSchema.parse(req.body.databaseConfig) : undefined;
            const result = await installService.createAdmin(validatedData, databaseConfig);
            if (result.success) {
                return sendSuccess(res, result, result.message);
            }
            else {
                return sendError(res, result.message, 500);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, error.message || 'Failed to create admin user', 500);
        }
    },
    /**
     * Finalize installation
     * POST /api/install/finalize
     */
    finalize: async (req, res) => {
        try {
            // Check if already installed
            const status = await installService.checkInstallationStatus();
            if (status.isInstalled) {
                throw new AppError('Application is already installed', 403);
            }
            const installedBy = req.body.installedBy || 'System';
            const databaseConfig = req.body.databaseConfig ? databaseConfigSchema.parse(req.body.databaseConfig) : undefined;
            const result = await installService.finalizeInstallation(installedBy, databaseConfig);
            if (result.success) {
                return sendSuccess(res, result, result.message);
            }
            else {
                return sendError(res, result.message, 500);
            }
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, error.message || 'Failed to finalize installation', 500);
        }
    },
    /**
     * Automatic setup - create database and user
     * POST /api/install/auto-setup
     */
    autoSetup: async (req, res) => {
        try {
            // Check if already installed
            const status = await installService.checkInstallationStatus();
            if (status.isInstalled) {
                throw new AppError('Application is already installed', 403);
            }
            const validatedData = autoSetupConfigSchema.parse(req.body);
            const result = await installService.autoSetup(validatedData);
            if (result.success) {
                return sendSuccess(res, result, result.message);
            }
            else {
                return sendError(res, result.message, 500);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, error.message || 'Failed to setup database automatically', 500);
        }
    },
    /**
     * Complete automatic installation
     * POST /api/install/complete-auto
     */
    completeAuto: async (req, res) => {
        try {
            // Check if already installed
            const status = await installService.checkInstallationStatus();
            if (status.isInstalled) {
                throw new AppError('Application is already installed', 403);
            }
            const autoSetupConfig = autoSetupConfigSchema.parse(req.body.autoSetupConfig);
            const adminData = adminUserSchema.parse(req.body.adminData);
            // Generate JWT secret if not provided
            const jwtSecret = req.body.jwtSecret || crypto.randomBytes(32).toString('base64');
            const clientUrl = req.body.clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
            const apiUrl = req.body.apiUrl || process.env.API_URL || 'http://localhost:5001';
            const result = await installService.completeAutoInstallation(autoSetupConfig, adminData, jwtSecret, clientUrl, apiUrl);
            if (result.success) {
                return sendSuccess(res, result, result.message);
            }
            else {
                return sendError(res, result.message, 500);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, error.message || 'Failed to complete automatic installation', 500);
        }
    },
};
//# sourceMappingURL=install.controller.js.map