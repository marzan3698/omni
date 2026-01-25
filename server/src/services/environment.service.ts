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

export const environmentService = {
  /**
   * Auto-detect .env file location
   * Checks: api/.env (cPanel), server/.env (local), ./.env (fallback)
   */
  detectEnvFilePath(): string {
    // Get current working directory
    const cwd = process.cwd();
    
    // Build possible paths in order of likelihood
    const possiblePaths = [
      // Most common: If running from server directory (local dev)
      path.join(cwd, '.env'),
      // If running from project root: server/.env
      path.join(cwd, 'server', '.env'),
      // cPanel structure: api/.env (if running from project root)
      path.join(cwd, 'api', '.env'),
      // Relative to current file location (go up from src/services or dist/services)
      path.resolve(__dirname, '..', '..', '.env'),
      path.resolve(__dirname, '..', '.env'),
    ];

    // Remove duplicates and normalize paths
    const uniquePaths = [...new Set(possiblePaths.map(p => path.normalize(p)))];
    
    console.log('[Environment Service] Current working directory:', cwd);
    console.log('[Environment Service] __dirname:', __dirname);
    console.log('[Environment Service] Searching for .env file in paths:', uniquePaths);
    
    for (const envPath of uniquePaths) {
      try {
        const normalizedPath = path.normalize(envPath);
        if (fs.existsSync(normalizedPath)) {
          const stats = fs.statSync(normalizedPath);
          console.log('[Environment Service] Found .env at:', normalizedPath, 'Size:', stats.size, 'bytes');
          return normalizedPath;
        }
      } catch (error: any) {
        // Continue to next path if this one fails
        console.log('[Environment Service] Path check failed for:', envPath, error.message);
        continue;
      }
    }

    throw new AppError(
      `Environment file (.env) not found. Searched in: ${uniquePaths.slice(0, 5).join(', ')}. Current working directory: ${cwd}`,
      404
    );
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
   * Read Facebook webhook configuration from .env file
   */
  readFacebookConfig(): FacebookConfig {
    try {
      const envPath = this.detectEnvFilePath();
      console.log('[Environment Service] Detected .env path:', envPath);
      
      if (!fs.existsSync(envPath)) {
        throw new AppError(`Environment file not found at: ${envPath}`, 404);
      }
      
      const content = fs.readFileSync(envPath, 'utf-8');
      const env = this.parseEnvFile(content);

      const config = {
        FACEBOOK_APP_ID: env.FACEBOOK_APP_ID || '',
        FACEBOOK_APP_SECRET: env.FACEBOOK_APP_SECRET || '',
        FACEBOOK_VERIFY_TOKEN: env.FACEBOOK_VERIFY_TOKEN || '',
        FACEBOOK_OAUTH_REDIRECT_URI: env.FACEBOOK_OAUTH_REDIRECT_URI || '',
      };
      
      console.log('[Environment Service] Successfully read config');
      return config;
    } catch (error: any) {
      console.error('[Environment Service] Error reading config:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to read environment file: ${error.message}`, 500);
    }
  },

  /**
   * Update Facebook webhook configuration in .env file
   */
  updateFacebookConfig(data: FacebookConfig): { message: string; envPath: string } {
    try {
      const envPath = this.detectEnvFilePath();
      
      // Read current content
      const originalContent = fs.readFileSync(envPath, 'utf-8');
      
      // Create backup
      const backupPath = `${envPath}.backup.${Date.now()}`;
      fs.writeFileSync(backupPath, originalContent);
      
      try {
        // Parse current env
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
        
        return {
          message: 'Facebook webhook configuration updated successfully',
          envPath,
        };
      } catch (writeError: any) {
        // Restore from backup on error
        if (fs.existsSync(backupPath)) {
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
