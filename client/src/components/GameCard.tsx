import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GameCardProps {
  children: React.ReactNode;
  className?: string;
  /** Index for staggered animate-game-item-reveal (omit to skip animation) */
  index?: number;
  /** Apply selected state (pulse border) */
  selected?: boolean;
  /** Apply hover lift effect */
  hover?: boolean;
}

export const GameCard = forwardRef<HTMLDivElement, GameCardProps>(
  ({ children, className, index, selected = false, hover = true }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'game-item-card rounded-lg overflow-hidden',
          hover && 'game-item-hover',
          selected && 'game-item-selected',
          index !== undefined && 'animate-game-item-reveal',
          className
        )}
        style={
          index !== undefined
            ? { animationDelay: `${index * 40}ms`, animationFillMode: 'both' }
            : undefined
        }
      >
        {children}
      </div>
    );
  }
);

GameCard.displayName = 'GameCard';
