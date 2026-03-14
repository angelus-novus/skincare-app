'use client';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export function StarRating({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <div className={cn('flex gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= value;
        const halfFilled = !filled && i + 0.5 <= value;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={cn('transition-colors', interactive && 'cursor-pointer hover:scale-110')}
          >
            <Star
              className={cn(
                sizes[size],
                filled || halfFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-200 fill-slate-200'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
