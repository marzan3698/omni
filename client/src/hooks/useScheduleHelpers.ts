import { useState, useEffect } from 'react';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

export function getCountdownParts(date: Date | string | null): CountdownParts | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const totalMs = d.getTime() - now.getTime();
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }
  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / 60000) % 60);
  const hours = Math.floor((totalMs / 3600000) % 24);
  const days = Math.floor(totalMs / 86400000);
  return { days, hours, minutes, seconds, totalMs, isPast: false };
}

/** Format countdown as "1d 2h 15m" or "45:32" (mm:ss) when under 1 hour */
export function formatCountdown(parts: CountdownParts | null): string {
  if (!parts) return '';
  if (parts.isPast) return 'Started';
  const { days, hours, minutes, seconds } = parts;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Live countdown display: "45:32" (mm:ss) for under 1h, "1:15:42" (h:mm:ss) for under 24h */
export function formatCountdownTimer(parts: CountdownParts | null): string {
  if (!parts) return '';
  if (parts.isPast) return '0:00';
  const { days, hours, minutes, seconds } = parts;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Live countdown - updates every second for real-time timer feel
 * Returns formatted string and raw parts for flexible display
 */
export function useLiveCountdown(date: Date | string | null): { display: string; timer: string; parts: CountdownParts | null } {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    if (!date) {
      setParts(null);
      return;
    }
    const update = () => setParts(getCountdownParts(date));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [date]);

  return {
    parts,
    display: formatCountdown(parts),
    timer: formatCountdownTimer(parts),
  };
}

/**
 * Legacy: short format, updates every 15s (use useLiveCountdown for live timer)
 */
export function useTimeUntil(date: Date | string | null): string {
  const { display } = useLiveCountdown(date);
  return display;
}

export function isUpcomingSoon(date: Date | string, withinMinutes = 60): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= withinMinutes * 60 * 1000;
}

export function isLiveNow(date: Date | string, durationMinutes: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const end = new Date(d.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();
  return now >= d && now <= end;
}

export function getTimeUntil(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();

  if (diffMs <= 0) return 'Started';
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `in ${diffDays}d`;
  if (diffHours > 0) return `in ${diffHours}h`;
  if (diffMins > 0) return `in ${diffMins}m`;
  return 'Now';
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
