import { useLiveCountdown } from '@/hooks/useScheduleHelpers';
import { cn } from '@/lib/utils';

interface LiveCountdownBadgeProps {
  date: Date | string | null;
  enabled?: boolean;
  /** Show timer format (45:32) when under 1h, else short format */
  showTimerWhenSoon?: boolean;
  className?: string;
}

export function LiveCountdownBadge({
  date,
  enabled = true,
  showTimerWhenSoon = true,
  className,
}: LiveCountdownBadgeProps) {
  const { timer, display, parts } = useLiveCountdown(enabled ? date : null);

  if (!date || !enabled || (parts?.isPast ?? true)) return null;

  const underOneHour = parts && parts.totalMs > 0 && parts.totalMs < 3600000;
  const text = showTimerWhenSoon && underOneHour ? timer : display;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold tabular-nums',
        'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 schedule-live-badge',
        className
      )}
      title={`Starts ${text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      <span className="live-countdown-digit">{text}</span>
    </span>
  );
}
