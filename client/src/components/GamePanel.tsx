import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GamePanelProps {
  children: React.ReactNode;
  className?: string;
  /** Show corner accents (default: true) */
  corners?: boolean;
  /** Show golden top accent bar (default: true) */
  topBar?: boolean;
}

export const GamePanel = forwardRef<HTMLDivElement, GamePanelProps>(
  ({ children, className, corners = true, topBar = true }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('game-panel rounded-xl overflow-hidden relative', className)}
      >
        {topBar && (
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent pointer-events-none z-10"
            style={{ boxShadow: '0 1px 2px rgba(217,119,6,0.3)' }}
          />
        )}
        {corners && (
          <>
            <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-amber-500/50 rounded-tl-lg pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-10 h-10 border-r-2 border-t-2 border-amber-500/50 rounded-tr-lg pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-l-2 border-b-2 border-amber-500/30 rounded-bl-lg pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-amber-500/30 rounded-br-lg pointer-events-none z-10" />
          </>
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GamePanel.displayName = 'GamePanel';
