import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency amount with BDT (৳) symbol
 * @param amount - The amount to format (number, string, null, or undefined)
 * @param options - Optional formatting options
 * @returns Formatted currency string with ৳ symbol
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options || {};
  
  return `৳${num.toLocaleString(undefined, { 
    minimumFractionDigits, 
    maximumFractionDigits 
  })}`;
}

/**
 * Format date and time in Bangladeshi timezone (Asia/Dhaka)
 * Returns format like "12 Jan 2026 at 2:00 PM"
 * @param date - Date object or ISO string
 * @returns Formatted date string in Bangladeshi time
 */
export function formatBangladeshiDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';

  // Format date: "12 Jan 2026"
  const datePart = dateObj.toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Format time: "2:00 PM"
  const timePart = dateObj.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} at ${timePart}`;
}

/**
 * Get the base URL for static files (uploads, images, etc.)
 * Removes '/api' suffix from VITE_API_URL if present
 */
export function getStaticFileBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  // Remove '/api' suffix if present
  return apiUrl.replace(/\/api$/, '') || 'http://localhost:5001';
}

/**
 * Construct full URL for a static file path
 * @param filePath - Path like '/uploads/tasks/task-11/attachments/image.png'
 * @returns Full URL like 'http://localhost:5001/uploads/tasks/task-11/attachments/image.png'
 */
export function getStaticFileUrl(filePath: string): string {
  if (filePath.startsWith('http')) {
    return filePath; // Already a full URL
  }
  const baseUrl = getStaticFileBaseUrl();
  // Ensure filePath starts with '/'
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${baseUrl}${normalizedPath}`;
}

