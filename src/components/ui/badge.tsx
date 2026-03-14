import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'gold' | 'sage';
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants = {
    default:     'bg-brand-100 text-brand-700',
    secondary:   'bg-ivory-dark text-obsidian-600 border border-ivory-darker',
    outline:     'border border-ivory-darker text-obsidian-600',
    destructive: 'bg-red-100 text-red-700',
    gold:        'bg-gold-100 text-gold-700',
    sage:        'bg-sage-100 text-sage-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
