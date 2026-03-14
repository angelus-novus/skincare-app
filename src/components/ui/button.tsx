import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const variants = {
    primary:     'bg-brand-500 text-white hover:bg-brand-600 shadow-sm',
    secondary:   'bg-ivory-dark text-obsidian-800 hover:bg-ivory-darker border border-ivory-darker',
    ghost:       'text-obsidian-600 hover:bg-brand-50 hover:text-brand-600',
    outline:     'border border-ivory-darker text-obsidian-700 hover:bg-brand-50 hover:border-brand-300',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    gold:        'text-obsidian-800 hover:brightness-95 shadow-sm',
  };

  const goldStyle = variant === 'gold'
    ? { background: 'linear-gradient(135deg, #C9A96E, #B8923A)', color: '#1C1917' }
    : {};

  const sizes = {
    sm:   'px-3 py-1.5 text-xs tracking-wide',
    md:   'px-4 py-2 text-sm',
    lg:   'px-6 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'font-sans tracking-wide',
        variants[variant],
        sizes[size],
        className
      )}
      style={goldStyle}
      {...props}
    >
      {children}
    </button>
  );
}
