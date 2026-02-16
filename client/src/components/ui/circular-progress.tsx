import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
  /** Use for dark backgrounds (e.g. FIFA-style widgets) */
  dark?: boolean;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true,
  children,
  dark = false,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={dark ? 'text-slate-600' : 'text-gray-200'}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-500',
            value >= 100 ? 'text-green-500' : value >= 75 ? 'text-blue-500' : value >= 50 ? 'text-yellow-500' : 'text-orange-500'
          )}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <div className="text-center">
            <div className={cn('text-2xl font-bold', dark ? 'text-amber-400' : 'text-slate-900')}>
              {Math.round(value)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

