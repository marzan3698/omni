interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}
interface MySQLRootConfig {
    host: string;
    port: number;
    rootUsername: string;
    rootPassword: string;
}
interface AutoSetupConfig {
    databaseName: string;
    databaseUsername: string;
    databasePassword: string;
    mysqlRoot?: MySQLRootConfig;
    useExistingDatabase?: boolean;
    existingDatabaseConfig?: DatabaseConfig;
}
interface AdminUserData {
    companyName: string;
    name: string;
    email: string;
    password: string;
}
export declare const installService: {
    /**
     * Check if installation is complete
     */
    checkInstallationStatus(): Promise<{
        isInstalled: boolean;
    }>;
    /**
     * Check prerequisites
     */
    checkPrerequisites(): Promise<{
        databaseConnection: {
            status: boolean;
            message: string;
        };
        filePermissions: {
            status: boolean;
            message: string;
        };
        uploadsDirectory: {
            status: boolean;
            message: string;
        };
        nodeVersion: {
            status: boolean;
            message: string;
            version?: string;
        };
    }>;
    /**
     * Create MySQL database automatically
     */
    createDatabase(rootConfig: MySQLRootConfig, databaseName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Create MySQL user and grant privileges
     */
    createDatabaseUser(rootConfig: MySQLRootConfig, databaseName: string, username: string, password: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Write environment variables to .env file
     */
    writeEnvFile(databaseConfig: DatabaseConfig, jwtSecret: string, clientUrl: string, apiUrl: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Automatic setup - creates database, user, and configures everything
     */
    autoSetup(config: AutoSetupConfig): Promise<{
        success: boolean;
        message: string;
        databaseConfig?: DatabaseConfig;
    }>;
    /**
     * Test database connection with provided credentials
     */
    testDatabaseConnection(config: DatabaseConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Setup database (run migrations)
     */
    setupDatabase(config: DatabaseConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Create admin user and company
     */
    createAdmin(data: AdminUserData, databaseConfig?: DatabaseConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Finalize installation
     */
    finalizeInstallation(installedBy: string, databaseConfig?: DatabaseConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Complete automatic installation - does everything in one go
     */
    completeAutoInstallation(autoSetupConfig: AutoSetupConfig, adminData: AdminUserData, jwtSecret: string, clientUrl: string, apiUrl: string): Promise<{
        success: boolean;
        message: string;
        steps: Array<{
            step: string;
            status: boolean;
            message: string;
        }>;
    }>;
};
export {};
//# sourceMappingURL=install.service.d.ts.map