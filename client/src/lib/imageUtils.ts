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

  // Use apiUrl directly instead of removing /api suffix
  const baseUrl = apiUrl;

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
  // Return apiUrl directly so static files use the backend route prefix
  return apiUrl;
}

/**
 * Resize image to 1024x1024 PNG and trigger download.
 * Used for Facebook App Icon (1024x1024 required).
 */
export async function downloadLogoAs1024Png(
  imageUrl: string,
  filename: string = 'facebook-app-icon-1024.png'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.clearRect(0, 0, 1024, 1024);
      const scale = Math.min(1024 / img.width, 1024 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (1024 - w) / 2;
      const y = (1024 - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          resolve();
        },
        'image/png',
        1
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}
