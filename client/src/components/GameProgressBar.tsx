import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Zap } from 'lucide-react';

interface GameProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  showBreakdown?: boolean;
  breakdown?: {
    completed: number;
    total: number;
    weighted?: boolean;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  /** Show XP/Level style labels */
  showXpStyle?: boolean;
  /** Show segmented checkpoints for sub-tasks */
  showSegments?: boolean;
  /** Show rank/level badge (Novice → Master) */
  showRank?: boolean;
}

export function GameProgressBar({
  progress,
  showPercentage = true,
  showBreakdown = true,
  breakdown,
  className,
  size = 'md',
  theme = 'dark',
  showXpStyle = true,
  showSegments = true,
  showRank = false,
}: GameProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);

  const targetProgress = Math.max(0, Math.min(100, progress));
  const isComplete = targetProgress >= 100;
  const total = breakdown?.total ?? 0;
  const completed = breakdown?.completed ?? 0;
  const hasBreakdown = total > 0;

  // Animate progress fill
  useEffect(() => {
    const duration = 900;
    const start = displayProgress;
    const diff = targetProgress - start;
    let startTime: number;

    const animate = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);
      setDisplayProgress(start + diff * easeOut);
      setDisplayPercent(Math.round(start + diff * easeOut));
      if (t < 1) requestAnimationFrame(animate);
      else {
        setDisplayProgress(targetProgress);
        setDisplayPercent(Math.round(targetProgress));
      }
    };
    requestAnimationFrame(animate);
  }, [targetProgress]);

  const heightClasses = { sm: 'h-2', md: 'h-3', lg: 'h-4' };
  const isDark = theme === 'dark';

  const getRank = (p: number) => {
    if (p >= 100) return { label: 'Complete', color: 'text-emerald-400' };
    if (p >= 75) return { label: 'Expert', color: 'text-amber-300' };
    if (p >= 50) return { label: 'Adept', color: 'text-amber-400' };
    if (p >= 25) return { label: 'Apprentice', color: 'text-amber-500' };
    return { label: 'Novice', color: 'text-amber-600' };
  };
  const rank = showRank ? getRank(displayProgress) : null;

  return (
    <div className={cn('w-full', className)}>
      {/* XP / Level header row */}
      {showXpStyle && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-amber-400/90' : 'text-amber-600')}>
              <Zap className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              Quest Progress
            </span>
            {hasBreakdown && (
              <span className={cn('text-xs', isDark ? 'text-amber-200/70' : 'text-slate-500')}>
                {completed}/{total} objectives
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {rank && (
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10', rank.color)}>
                {rank.label}
              </span>
            )}
            {showPercentage && (
              <span
                className={cn(
                  'font-mono font-bold tabular-nums transition-all',
                  size === 'sm' ? 'text-xs' : 'text-sm',
                  isComplete
                    ? 'text-amber-400 animate-game-progress-complete'
                    : isDark
                    ? 'text-amber-200'
                    : 'text-slate-700'
                )}
              >
                {displayPercent}%
              </span>
            )}
            {isComplete && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-xs animate-game-quest-badge">
                <Trophy className="w-4 h-4" />
                Complete!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar track */}
      <div
        className={cn(
          'relative w-full rounded-full overflow-hidden',
          heightClasses[size],
          'game-progress-track',
          isDark && 'game-progress-track-dark'
        )}
      >
        {/* Segment dividers (checkpoints) */}
        {showSegments && hasBreakdown && total > 1 && (
          <div className="absolute inset-0 flex z-10 pointer-events-none">
            {Array.from({ length: total - 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-amber-500/30"
                style={{ left: `${((i + 1) / total) * 100}%` }}
              />
            ))}
          </div>
        )}

        {/* Fill with gradient + shimmer */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
            'game-progress-fill',
            isComplete && 'game-progress-fill-complete'
          )}
          style={{ width: `${displayProgress}%` }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 game-progress-shimmer" />
          {/* Inner highlight */}
          <div className="absolute inset-0 game-progress-inner-glow" />
        </div>
      </div>

      {/* Breakdown footer */}
      {showBreakdown && hasBreakdown && (
        <div className={cn('mt-2 flex items-center justify-between text-xs', isDark ? 'text-amber-200/70' : 'text-slate-500')}>
          <span>
            {breakdown.weighted ? 'Weighted objectives' : 'Objectives'} completed
          </span>
          {!showXpStyle && showPercentage && (
            <span className="font-mono font-medium">{displayPercent}%</span>
          )}
        </div>
      )}
    </div>
  );
}
