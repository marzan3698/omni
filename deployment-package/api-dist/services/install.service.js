import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import mysql from 'mysql2/promise';
import { AppError } from '../middleware/errorHandler.js';
const execAsync = promisify(exec);
export const installService = {
    /**
     * Check if installation is complete
     */
    async checkInstallationStatus() {
        try {
            const prisma = new PrismaClient();
            const installation = await prisma.installation.findFirst();
            await prisma.$disconnect();
            return {
                isInstalled: installation?.isInstalled || false,
            };
        }
        catch (error) {
            // If database doesn't exist or table doesn't exist, installation is not complete
            return { isInstalled: false };
        }
    },
    /**
     * Check prerequisites
     */
    async checkPrerequisites() {
        const results = {
            databaseConnection: { status: false, message: 'Not checked' },
            filePermissions: { status: false, message: 'Not checked' },
            uploadsDirectory: { status: false, message: 'Not checked' },
            nodeVersion: { status: false, message: 'Not checked' },
        };
        // Check Node.js version
        try {
            const { stdout } = await execAsync('node --version');
            const version = stdout.trim();
            const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
            results.nodeVersion = {
                status: majorVersion >= 18,
                message: majorVersion >= 18 ? `Node.js ${version} is installed` : `Node.js 18+ required, found ${version}`,
                version,
            };
        }
        catch (error) {
            results.nodeVersion = {
                status: false,
                message: 'Node.js not found',
            };
        }
        // Check uploads directory
        const uploadsPath = path.join(process.cwd(), 'uploads');
        try {
            if (!fs.existsSync(uploadsPath)) {
                fs.mkdirSync(uploadsPath, { recursive: true });
            }
            results.uploadsDirectory = {
                status: true,
                message: 'Uploads directory exists and is accessible',
            };
        }
        catch (error) {
            results.uploadsDirectory = {
                status: false,
                message: 'Cannot create or access uploads directory',
            };
        }
        // Check file permissions
        try {
            const testFile = path.join(uploadsPath, '.test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            results.filePermissions = {
                status: true,
                message: 'File permissions are correct',
            };
        }
        catch (error) {
            results.filePermissions = {
                status: false,
                message: 'Cannot write to uploads directory',
            };
        }
        // Check database connection (if DATABASE_URL is set)
        if (process.env.DATABASE_URL) {
            try {
                const prisma = new PrismaClient();
                await prisma.$connect();
                await prisma.$disconnect();
                results.databaseConnection = {
                    status: true,
                    message: 'Database connection successful',
                };
            }
            catch (error) {
                results.databaseConnection = {
                    status: false,
                    message: 'Database connection failed. Please configure database settings.',
                };
            }
        }
        else {
            results.databaseConnection = {
                status: false,
                message: 'Database URL not configured',
            };
        }
        return results;
    },
    /**
     * Create MySQL database automatically
     */
    async createDatabase(rootConfig, databaseName) {
        let connection = null;
        try {
            // Connect with root credentials
            connection = await mysql.createConnection({
                host: rootConfig.host,
                port: rootConfig.port,
                user: rootConfig.rootUsername,
                password: rootConfig.rootPassword,
            });
            // Create database
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            await connection.end();
            return {
                success: true,
                message: `Database '${databaseName}' created successfully`,
            };
        }
        catch (error) {
            if (connection) {
                await connection.end();
            }
            return {
                success: false,
                message: error.message || 'Failed to create database',
            };
        }
    },
    /**
     * Create MySQL user and grant privileges
     */
    async createDatabaseUser(rootConfig, databaseName, username, password) {
        let connection = null;
        try {
            // Connect with root credentials
            connection = await mysql.createConnection({
                host: rootConfig.host,
                port: rootConfig.port,
                user: rootConfig.rootUsername,
                password: rootConfig.rootPassword,
            });
            // Create user
            await connection.query(`CREATE USER IF NOT EXISTS '${username}'@'localhost' IDENTIFIED BY '${password}'`);
            // Grant privileges
            await connection.query(`GRANT ALL PRIVILEGES ON \`${databaseName}\`.* TO '${username}'@'localhost'`);
            // Flush privileges
            await connection.query('FLUSH PRIVILEGES');
            await connection.end();
            return {
                success: true,
                message: `Database user '${username}' created and privileges granted`,
            };
        }
        catch (error) {
            if (connection) {
                await connection.end();
            }
            return {
                success: false,
                message: error.message || 'Failed to create database user',
            };
        }
    },
    /**
     * Write environment variables to .env file
     */
    async writeEnvFile(databaseConfig, jwtSecret, clientUrl, apiUrl) {
        try {
            const envPath = path.join(process.cwd(), '.env');
            const connectionString = `mysql://${databaseConfig.username}:${databaseConfig.password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`;
            const envContent = `# Omni CRM - Auto-generated during installation
# Generated at: ${new Date().toISOString()}

# Server Configuration
NODE_ENV=production
PORT=${process.env.PORT || 5001}

# Database Configuration
DATABASE_URL=${connectionString}

# JWT Authentication
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d

# Application URLs
CLIENT_URL=${clientUrl}
API_URL=${apiUrl}

# Facebook Integration (Optional - configure later)
FACEBOOK_APP_ID=
FACEBOOK_VERIFY_TOKEN=

# Chatwoot Integration (Optional - configure later)
CHATWOOT_WEBHOOK_URL=${apiUrl}/api/chatwoot/webhooks/chatwoot
LIVE_WEBHOOK_URL=${apiUrl}/api/webhooks/facebook
LOCAL_WEBHOOK_URL=${apiUrl}/api/webhooks/facebook

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
`;
            // Write to .env file
            fs.writeFileSync(envPath, envContent, 'utf8');
            // Set file permissions (600 = read/write for owner only)
            try {
                fs.chmodSync(envPath, 0o600);
            }
            catch (error) {
                // chmod might fail on some systems, continue anyway
                console.warn('Could not set .env file permissions:', error);
            }
            // Also update process.env for current session
            process.env.DATABASE_URL = connectionString;
            process.env.JWT_SECRET = jwtSecret;
            process.env.CLIENT_URL = clientUrl;
            process.env.API_URL = apiUrl;
            return {
                success: true,
                message: 'Environment variables written to .env file',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to write .env file',
            };
        }
    },
    /**
     * Automatic setup - creates database, user, and configures everything
     */
    async autoSetup(config) {
        try {
            let databaseConfig;
            // If using existing database, use provided config
            if (config.useExistingDatabase && config.existingDatabaseConfig) {
                databaseConfig = config.existingDatabaseConfig;
            }
            else if (config.mysqlRoot) {
                // Create database automatically
                const dbResult = await this.createDatabase(config.mysqlRoot, config.databaseName);
                if (!dbResult.success) {
                    return {
                        success: false,
                        message: `Failed to create database: ${dbResult.message}`,
                    };
                }
                // Create database user automatically
                const userResult = await this.createDatabaseUser(config.mysqlRoot, config.databaseName, config.databaseUsername, config.databasePassword);
                if (!userResult.success) {
                    return {
                        success: false,
                        message: `Failed to create database user: ${userResult.message}`,
                    };
                }
                // Create database config
                databaseConfig = {
                    host: config.mysqlRoot.host,
                    port: config.mysqlRoot.port,
                    database: config.databaseName,
                    username: config.databaseUsername,
                    password: config.databasePassword,
                };
            }
            else {
                return {
                    success: false,
                    message: 'MySQL root credentials or existing database config required',
                };
            }
            return {
                success: true,
                message: 'Automatic setup completed successfully',
                databaseConfig,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Automatic setup failed',
            };
        }
    },
    /**
     * Test database connection with provided credentials
     */
    async testDatabaseConnection(config) {
        try {
            const connectionString = `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
            const testPrisma = new PrismaClient({
                datasources: {
                    db: {
                        url: connectionString,
                    },
                },
            });
            await testPrisma.$connect();
            await testPrisma.$disconnect();
            return {
                success: true,
                message: 'Database connection successful',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Database connection failed',
            };
        }
    },
    /**
     * Setup database (run migrations)
     */
    async setupDatabase(config) {
        try {
            // Update DATABASE_URL in environment
            const connectionString = `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
            process.env.DATABASE_URL = connectionString;
            // Generate Prisma client
            try {
                await execAsync('npx prisma generate', { cwd: process.cwd() });
            }
            catch (error) {
                console.error('Prisma generate error:', error);
                // Continue anyway
            }
            // Push schema to database
            try {
                await execAsync('npx prisma db push --accept-data-loss', { cwd: process.cwd() });
            }
            catch (error) {
                console.error('Prisma db push error:', error);
                throw new AppError('Failed to create database schema', 500);
            }
            return {
                success: true,
                message: 'Database setup completed successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Database setup failed',
            };
        }
    },
    /**
     * Create admin user and company
     */
    async createAdmin(data, databaseConfig) {
        try {
            // Use provided database config if available, otherwise use environment variable
            const prisma = databaseConfig
                ? new PrismaClient({
                    datasources: {
                        db: {
                            url: `mysql://${databaseConfig.username}:${databaseConfig.password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`,
                        },
                    },
                })
                : new PrismaClient();
            // Create or get SuperAdmin role
            const superAdminRole = await prisma.role.upsert({
                where: { name: 'SuperAdmin' },
                update: {
                    permissions: {
                        can_delete_users: true,
                        can_edit_users: true,
                        can_view_users: true,
                        can_reply_social: true,
                        can_manage_roles: true,
                        can_view_reports: true,
                        can_manage_finance: true,
                        can_manage_companies: true,
                        can_manage_employees: true,
                        can_manage_tasks: true,
                        can_manage_leads: true,
                        can_manage_inbox: true,
                        can_view_companies: true,
                        can_view_employees: true,
                        can_view_tasks: true,
                        can_view_leads: true,
                        can_view_finance: true,
                        can_create_leads: true,
                        can_manage_users: true,
                        can_view_all_users: true,
                        can_manage_integrations: true,
                        can_view_integrations: true,
                        can_manage_task_config: true,
                        can_manage_root_items: true,
                        can_manage_lead_config: true,
                        can_view_all_tasks: true,
                        can_assign_tasks_to_anyone: true,
                        can_manage_campaigns: true,
                        can_manage_products: true,
                        can_manage_payment_settings: true,
                    },
                },
                create: {
                    name: 'SuperAdmin',
                    permissions: {
                        can_delete_users: true,
                        can_edit_users: true,
                        can_view_users: true,
                        can_reply_social: true,
                        can_manage_roles: true,
                        can_view_reports: true,
                        can_manage_finance: true,
                        can_manage_companies: true,
                        can_manage_employees: true,
                        can_manage_tasks: true,
                        can_manage_leads: true,
                        can_manage_inbox: true,
                        can_view_companies: true,
                        can_view_employees: true,
                        can_view_tasks: true,
                        can_view_leads: true,
                        can_view_finance: true,
                        can_create_leads: true,
                        can_manage_users: true,
                        can_view_all_users: true,
                        can_manage_integrations: true,
                        can_view_integrations: true,
                        can_manage_task_config: true,
                        can_manage_root_items: true,
                        can_manage_lead_config: true,
                        can_view_all_tasks: true,
                        can_assign_tasks_to_anyone: true,
                        can_manage_campaigns: true,
                        can_manage_products: true,
                        can_manage_payment_settings: true,
                    },
                },
            });
            // Create company
            const company = await prisma.company.create({
                data: {
                    name: data.companyName,
                    email: data.email,
                    isActive: true,
                },
            });
            // Hash password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(data.password, saltRounds);
            // Create admin user
            await prisma.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    name: data.name,
                    passwordHash,
                    roleId: superAdminRole.id,
                    companyId: company.id,
                },
            });
            await prisma.$disconnect();
            return {
                success: true,
                message: 'Admin user created successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to create admin user',
            };
        }
    },
    /**
     * Finalize installation
     */
    async finalizeInstallation(installedBy, databaseConfig) {
        try {
            // Use provided database config if available, otherwise use environment variable
            const prisma = databaseConfig
                ? new PrismaClient({
                    datasources: {
                        db: {
                            url: `mysql://${databaseConfig.username}:${databaseConfig.password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`,
                        },
                    },
                })
                : new PrismaClient();
            // Mark installation as complete
            await prisma.installation.upsert({
                where: { id: 1 },
                update: {
                    isInstalled: true,
                    installedAt: new Date(),
                    installedBy,
                },
                create: {
                    id: 1,
                    isInstalled: true,
                    installedAt: new Date(),
                    installedBy,
                },
            });
            await prisma.$disconnect();
            return {
                success: true,
                message: 'Installation completed successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to finalize installation',
            };
        }
    },
    /**
     * Complete automatic installation - does everything in one go
     */
    async completeAutoInstallation(autoSetupConfig, adminData, jwtSecret, clientUrl, apiUrl) {
        const steps = [];
        try {
            // Step 1: Auto setup (create database and user)
            steps.push({ step: 'auto_setup', status: false, message: 'Setting up database...' });
            const setupResult = await this.autoSetup(autoSetupConfig);
            if (!setupResult.success || !setupResult.databaseConfig) {
                steps[steps.length - 1].status = false;
                steps[steps.length - 1].message = setupResult.message;
                return {
                    success: false,
                    message: 'Automatic setup failed',
                    steps,
                };
            }
            steps[steps.length - 1].status = true;
            steps[steps.length - 1].message = 'Database and user created successfully';
            const databaseConfig = setupResult.databaseConfig;
            // Step 2: Write .env file
            steps.push({ step: 'write_env', status: false, message: 'Writing environment variables...' });
            const envResult = await this.writeEnvFile(databaseConfig, jwtSecret, clientUrl, apiUrl);
            if (!envResult.success) {
                steps[steps.length - 1].status = false;
                steps[steps.length - 1].message = envResult.message;
                return {
                    success: false,
                    message: 'Failed to write environment variables',
                    steps,
                };
            }
            steps[steps.length - 1].status = true;
            steps[steps.length - 1].message = 'Environment variables configured';
            // Step 3: Setup database schema
            steps.push({ step: 'setup_schema', status: false, message: 'Creating database schema...' });
            const schemaResult = await this.setupDatabase(databaseConfig);
            if (!schemaResult.success) {
                steps[steps.length - 1].status = false;
                steps[steps.length - 1].message = schemaResult.message;
                return {
                    success: false,
                    message: 'Failed to setup database schema',
                    steps,
                };
            }
            steps[steps.length - 1].status = true;
            steps[steps.length - 1].message = 'Database schema created';
            // Step 4: Create admin user
            steps.push({ step: 'create_admin', status: false, message: 'Creating admin user...' });
            const adminResult = await this.createAdmin(adminData, databaseConfig);
            if (!adminResult.success) {
                steps[steps.length - 1].status = false;
                steps[steps.length - 1].message = adminResult.message;
                return {
                    success: false,
                    message: 'Failed to create admin user',
                    steps,
                };
            }
            steps[steps.length - 1].status = true;
            steps[steps.length - 1].message = 'Admin user created';
            // Step 5: Finalize installation
            steps.push({ step: 'finalize', status: false, message: 'Finalizing installation...' });
            const finalizeResult = await this.finalizeInstallation(adminData.email, databaseConfig);
            if (!finalizeResult.success) {
                steps[steps.length - 1].status = false;
                steps[steps.length - 1].message = finalizeResult.message;
                return {
                    success: false,
                    message: 'Failed to finalize installation',
                    steps,
                };
            }
            steps[steps.length - 1].status = true;
            steps[steps.length - 1].message = 'Installation completed';
            return {
                success: true,
                message: 'Automatic installation completed successfully',
                steps,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Automatic installation failed',
                steps,
            };
        }
    },
};
//# sourceMappingURL=install.service.js.map