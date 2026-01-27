import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../middleware/errorHandler.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FacebookConfig {
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  FACEBOOK_VERIFY_TOKEN: string;
  FACEBOOK_OAUTH_REDIRECT_URI: string;
}

interface EnvFileResult {
  found: boolean;
  path: string | null;
  isCPanel: boolean;
}

export const environmentService = {
  /**
   * Check if running in cPanel environment
   */
  isCPanelEnvironment(): boolean {
    const cwd = process.cwd();
    // cPanel typically has ~/api structure or nodevenv path
    return cwd.includes('/home/') && (
      cwd.includes('/api') || 
      fs.existsSync(path.join(cwd, '..', 'public_html')) ||
      process.env.NODE_ENV === 'production'
    );
  },

  /**
   * Auto-detect .env file location
   * Checks: api/.env (cPanel), server/.env (local), ./.env (fallback)
   * Returns null if not found (for cPanel where env vars are set via interface)
   */
  detectEnvFilePath(): EnvFileResult {
    const cwd = process.cwd();
    const isCPanel = this.isCPanelEnvironment();
    
    // Build possible paths in order of likelihood
    const possiblePaths = [
      // Most common: If running from server directory (local dev)
      path.join(cwd, '.env'),
      // If running from project root: server/.env
      path.join(cwd, 'server', '.env'),
      // cPanel structure: api/.env (if running from project root)
      path.join(cwd, 'api', '.env'),
      // Home directory in cPanel
      path.join(process.env.HOME || '~', 'api', '.env'),
      // Relative to current file location (go up from src/services or dist/services)
      path.resolve(__dirname, '..', '..', '.env'),
      path.resolve(__dirname, '..', '.env'),
    ];

    // Remove duplicates and normalize paths
    const uniquePaths = [...new Set(possiblePaths.map(p => path.normalize(p)))];
    
    console.log('[Environment Service] Current working directory:', cwd);
    console.log('[Environment Service] Is cPanel environment:', isCPanel);
    console.log('[Environment Service] Searching for .env file in paths:', uniquePaths);
    
    for (const envPath of uniquePaths) {
      try {
        const normalizedPath = path.normalize(envPath);
        if (fs.existsSync(normalizedPath)) {
          const stats = fs.statSync(normalizedPath);
          console.log('[Environment Service] Found .env at:', normalizedPath, 'Size:', stats.size, 'bytes');
          return { found: true, path: normalizedPath, isCPanel };
        }
      } catch (error: any) {
        // Continue to next path if this one fails
        continue;
      }
    }

    // In cPanel, .env file might not exist - env vars are set via cPanel interface
    console.log('[Environment Service] No .env file found. Will read from process.env');
    return { found: false, path: null, isCPanel };
  },

  /**
   * Get default .env file path for creating new file
   */
  getDefaultEnvFilePath(): string {
    const cwd = process.cwd();
    if (this.isCPanelEnvironment()) {
      // In cPanel, create .env in api directory
      return path.join(cwd, '.env');
    }
    // Local development
    return path.join(cwd, '.env');
  },

  /**
   * Parse .env file content into key-value pairs
   * Handles duplicates by keeping the last occurrence
   */
  parseEnvFile(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Handle key=value format
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Keep last occurrence if duplicate (overwrites previous)
      env[key] = value;
    }

    return env;
  },

  /**
   * Format parsed env data back to .env file format
   * Removes duplicates and updates all occurrences
   */
  formatEnvFile(env: Record<string, string>, originalContent: string): string {
    const lines = originalContent.split('\n');
    const result: string[] = [];
    const updatedKeys = new Set<string>();
    const seenKeys = new Set<string>();

    // Process original lines to preserve comments and structure
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Keep comments and empty lines as-is
      if (!trimmed || trimmed.startsWith('#')) {
        result.push(line);
        continue;
      }

      // Check if this line has a key we need to update
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) {
        result.push(line);
        continue;
      }

      const key = trimmed.substring(0, equalIndex).trim();
      
      // If this key is in our env object, update it (only first occurrence)
      if (env[key] !== undefined && !seenKeys.has(key)) {
        const value = env[key];
        // Preserve original formatting (quotes, spacing)
        const originalValue = trimmed.substring(equalIndex + 1).trim();
        const hasQuotes = (originalValue.startsWith('"') && originalValue.endsWith('"')) ||
                          (originalValue.startsWith("'") && originalValue.endsWith("'"));
        
        if (hasQuotes) {
          result.push(`${key}="${value}"`);
        } else {
          result.push(`${key}=${value}`);
        }
        updatedKeys.add(key);
        seenKeys.add(key);
      } else if (seenKeys.has(key)) {
        // Skip duplicate keys (remove duplicates)
        continue;
      } else {
        // Keep original line for keys we're not updating
        result.push(line);
      }
    }

    // Add any new keys that weren't in the original file
    for (const [key, value] of Object.entries(env)) {
      if (!updatedKeys.has(key)) {
        result.push(`${key}=${value}`);
      }
    }

    return result.join('\n');
  },

  /**
   * Read Facebook webhook configuration
   * Reads from .env file if exists, otherwise from process.env (cPanel)
   */
  readFacebookConfig(): FacebookConfig & { source: string; isCPanel: boolean } {
    try {
      const envResult = this.detectEnvFilePath();
      console.log('[Environment Service] Env detection result:', envResult);
      
      let config: FacebookConfig;
      let source: string;
      
      if (envResult.found && envResult.path) {
        // Read from .env file
        console.log('[Environment Service] Reading from .env file:', envResult.path);
        const content = fs.readFileSync(envResult.path, 'utf-8');
        const env = this.parseEnvFile(content);
        
        config = {
          FACEBOOK_APP_ID: env.FACEBOOK_APP_ID || '',
          FACEBOOK_APP_SECRET: env.FACEBOOK_APP_SECRET || '',
          FACEBOOK_VERIFY_TOKEN: env.FACEBOOK_VERIFY_TOKEN || '',
          FACEBOOK_OAUTH_REDIRECT_URI: env.FACEBOOK_OAUTH_REDIRECT_URI || '',
        };
        source = envResult.path;
      } else {
        // Read from process.env (cPanel or when .env doesn't exist)
        console.log('[Environment Service] Reading from process.env (cPanel mode or no .env file)');
        config = {
          FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
          FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
          FACEBOOK_VERIFY_TOKEN: process.env.FACEBOOK_VERIFY_TOKEN || '',
          FACEBOOK_OAUTH_REDIRECT_URI: process.env.FACEBOOK_OAUTH_REDIRECT_URI || '',
        };
        source = 'process.env (cPanel Environment Variables)';
      }
      
      console.log('[Environment Service] Successfully read config from:', source);
      return { ...config, source, isCPanel: envResult.isCPanel };
    } catch (error: any) {
      console.error('[Environment Service] Error reading config:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to read environment configuration: ${error.message}`, 500);
    }
  },

  /**
   * Update Facebook webhook configuration
   * Creates .env file if it doesn't exist, otherwise updates existing file
   */
  updateFacebookConfig(data: FacebookConfig): { message: string; envPath: string; isCPanel: boolean; requiresRestart: boolean } {
    try {
      const envResult = this.detectEnvFilePath();
      const isCPanel = envResult.isCPanel;
      let envPath: string;
      let originalContent = '';
      let isNewFile = false;
      
      if (envResult.found && envResult.path) {
        // Use existing .env file
        envPath = envResult.path;
        originalContent = fs.readFileSync(envPath, 'utf-8');
      } else {
        // Create new .env file
        envPath = this.getDefaultEnvFilePath();
        isNewFile = true;
        console.log('[Environment Service] Creating new .env file at:', envPath);
        
        // Create initial content with Facebook config only
        originalContent = `# Facebook Webhook Configuration
# Generated by Omni CRM Environment Manager
# Date: ${new Date().toISOString()}

`;
      }
      
      // Create backup if file exists
      const backupPath = `${envPath}.backup.${Date.now()}`;
      if (!isNewFile) {
        fs.writeFileSync(backupPath, originalContent);
      }
      
      try {
        // Parse current env (or empty for new file)
        const env = this.parseEnvFile(originalContent);
        
        // Update Facebook config
        env.FACEBOOK_APP_ID = data.FACEBOOK_APP_ID;
        env.FACEBOOK_APP_SECRET = data.FACEBOOK_APP_SECRET;
        env.FACEBOOK_VERIFY_TOKEN = data.FACEBOOK_VERIFY_TOKEN;
        env.FACEBOOK_OAUTH_REDIRECT_URI = data.FACEBOOK_OAUTH_REDIRECT_URI;
        
        // Format back to .env format
        const newContent = this.formatEnvFile(env, originalContent);
        
        // Write to file
        fs.writeFileSync(envPath, newContent, 'utf-8');
        
        // Update process.env for immediate effect (without restart)
        process.env.FACEBOOK_APP_ID = data.FACEBOOK_APP_ID;
        process.env.FACEBOOK_APP_SECRET = data.FACEBOOK_APP_SECRET;
        process.env.FACEBOOK_VERIFY_TOKEN = data.FACEBOOK_VERIFY_TOKEN;
        process.env.FACEBOOK_OAUTH_REDIRECT_URI = data.FACEBOOK_OAUTH_REDIRECT_URI;
        
        // Build message based on environment
        let message = 'Facebook webhook configuration updated successfully';
        if (isCPanel) {
          message += '. Note: In cPanel, you may also need to add these variables in Node.js Selector environment variables section for persistence after app restart.';
        }
        if (isNewFile) {
          message = 'Created new .env file and saved Facebook webhook configuration. ' + message;
        }
        
        return {
          message,
          envPath,
          isCPanel,
          requiresRestart: isCPanel,
        };
      } catch (writeError: any) {
        // Restore from backup on error
        if (!isNewFile && fs.existsSync(backupPath)) {
          fs.writeFileSync(envPath, originalContent, 'utf-8');
        }
        throw new AppError(`Failed to update environment file: ${writeError.message}`, 500);
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to update environment file: ${error.message}`, 500);
    }
  },
};
