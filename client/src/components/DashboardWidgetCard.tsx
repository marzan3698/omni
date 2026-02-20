import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardWidgetCardProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
  link?: string;
  compact?: boolean;
}

const fifaCardStyle = {
  background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 35%, #0c0a1a 70%, #1e1b4b 100%)',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 0 0 2px rgba(217,119,6,0.5), 0 0 16px -2px rgba(217,119,6,0.2), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)',
};

export const DashboardWidgetCard = forwardRef<HTMLDivElement, DashboardWidgetCardProps>(
  ({ children, index = 0, className, link, compact = false }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-xl transition-all duration-300',
          'hover:scale-[1.01] hover:shadow-[0_0_28px_-2px_rgba(217,119,6,0.35),0_0_0_2px_rgba(217,119,6,0.6)]',
          'animate-game-stat-reveal',
          compact ? 'p-4' : 'p-5',
          className
        )}
        style={{
          ...fifaCardStyle,
          animationDelay: `${index * 60}ms`,
          animationFillMode: 'both',
        }}
      >
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            ...fifaCardStyle,
            background: 'linear-gradient(90deg, transparent 0%, rgba(217,119,6,0.08) 25%, rgba(217,119,6,0.2) 50%, rgba(217,119,6,0.08) 75%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'game-shimmer 5s ease-in-out infinite',
          }}
        />
        {/* Golden top accent - metallic feel */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" style={{ boxShadow: '0 1px 2px rgba(217,119,6,0.3)' }} />
        <div className="relative z-10">{children}</div>
      </div>
    );

    if (link) {
      return (
        <Link to={link} className="block">
          {content}
        </Link>
      );
    }
    return content;
  }
);

DashboardWidgetCard.displayName = 'DashboardWidgetCard';
