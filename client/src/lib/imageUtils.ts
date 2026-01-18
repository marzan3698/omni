/**
 * Utility functions for handling image URLs
 */

/**
 * Get the full URL for an image path
 * Handles both relative paths (/uploads/...) and absolute URLs
 * 
 * @param path - Image path from backend (e.g., "/uploads/theme/logo-123.png")
 * @returns Full URL for the image (e.g., "https://api.paaera.com/uploads/theme/logo-123.png")
 */
export function getImageUrl(path: string | null | undefined): string {
  // Return empty string if path is null/undefined
  if (!path) {
    return '';
  }

  // If path is already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Get API base URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  
  // Remove /api suffix for static files (images are served directly, not through /api route)
  const baseUrl = apiUrl.replace(/\/api$/, '');
  
  // Ensure path starts with /
  const imagePath = path.startsWith('/') ? path : `/${path}`;
  
  // Return full URL
  return `${baseUrl}${imagePath}`;
}

/**
 * Get the API base URL (without /api suffix) for static files
 * 
 * @returns Base URL for static files (e.g., "https://api.paaera.com")
 */
export function getApiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  return apiUrl.replace(/\/api$/, '');
}
