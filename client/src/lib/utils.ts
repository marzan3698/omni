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
 * Format amount with currency symbol (BDT=৳, USD=$)
 */
export function formatCurrencyWithSymbol(
  amount: number | string | null | undefined,
  currency: 'BDT' | 'USD' = 'BDT',
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  const symbol = currency === 'BDT' ? '৳' : '$';
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options || {};
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits })}`;
}

/**
 * Format days to "X মাস Y দিন" (months and days)
 * Uses 30 days per month for display
 * @param days - Number of days
 * @param useBengali - Use Bengali numerals (default true)
 */
export function formatDaysToMonthsDays(days: number, useBengali = true): string {
  if (!Number.isFinite(days) || days < 0) return '-';
  if (days === 0) return useBengali ? '০ দিন' : '0 days';
  const months = Math.floor(days / 30);
  const remainder = days % 30;
  const bn = (n: number) => n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
  if (months === 0) {
    return useBengali ? `${bn(remainder)} দিন` : `${remainder} দিন`;
  }
  if (remainder === 0) {
    return useBengali ? `${bn(months)} মাস` : `${months} মাস`;
  }
  return useBengali
    ? `${bn(months)} মাস ${bn(remainder)} দিন`
    : `${months} মাস ${remainder} দিন`;
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
 * Uses VITE_API_URL exactly as defined so that Passenger routes the request to the backend.
 */
export function getStaticFileBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  // Return the API URL directly so requests go to /api/uploads and hit the backend
  return apiUrl;
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

