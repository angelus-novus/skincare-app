import { cn } from '@/lib/utils';
import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium tracking-wider uppercase text-obsidian-500">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full rounded-lg px-3 py-2 text-sm text-obsidian-800',
          'bg-white border border-ivory-darker',
          'placeholder:text-obsidian-300',
          'focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400',
          'transition-colors',
          error && 'border-red-300 focus:ring-red-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium tracking-wider uppercase text-obsidian-500">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full rounded-lg px-3 py-2 text-sm text-obsidian-800',
          'bg-white border border-ivory-darker',
          'placeholder:text-obsidian-300',
          'focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400',
          'transition-colors resize-none',
          error && 'border-red-300 focus:ring-red-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
