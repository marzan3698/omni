import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  showBreakdown?: boolean;
  breakdown?: {
    completed: number;
    total: number;
    weighted?: boolean;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedProgressBar({
  progress,
  showPercentage = true,
  showBreakdown = false,
  breakdown,
  className,
  size = 'md',
}: AnimatedProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate progress changes
  useEffect(() => {
    const targetProgress = Math.max(0, Math.min(100, progress));
    const duration = 800; // Animation duration in ms
    const startProgress = displayProgress;
    const difference = targetProgress - startProgress;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progressRatio, 3);

      const currentProgress = startProgress + difference * easeOut;
      setDisplayProgress(currentProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayProgress(targetProgress);
      }
    };

    requestAnimationFrame(animate);
  }, [progress]);

  // Determine color based on progress
  const getColorClasses = (prog: number) => {
    if (prog <= 30) {
      return 'bg-red-500';
    } else if (prog <= 70) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  };

  const getBgColorClasses = (prog: number) => {
    if (prog <= 30) {
      return 'bg-red-50';
    } else if (prog <= 70) {
      return 'bg-yellow-50';
    } else {
      return 'bg-green-50';
    }
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar container */}
      <div
        className={cn(
          'relative w-full rounded-full overflow-hidden',
          heightClasses[size],
          getBgColorClasses(displayProgress)
        )}
      >
        {/* Progress fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            getColorClasses(displayProgress)
          )}
          style={{ width: `${displayProgress}%` }}
        />

        {/* Percentage text overlay (optional) */}
        {showPercentage && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'font-semibold',
                textSizeClasses[size],
                displayProgress > 50 ? 'text-white' : 'text-slate-700'
              )}
            >
              {Math.round(displayProgress)}%
            </span>
          </div>
        )}
      </div>

      {/* Breakdown info (if provided) */}
      {showBreakdown && breakdown && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>
            {breakdown.completed} of {breakdown.total} {breakdown.weighted ? 'weighted' : ''} sub-tasks completed
          </span>
          {showPercentage && size === 'sm' && (
            <span className="font-medium">{Math.round(displayProgress)}%</span>
          )}
        </div>
      )}
    </div>
  );
}

