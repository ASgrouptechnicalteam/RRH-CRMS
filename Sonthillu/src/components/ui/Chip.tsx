'use client';

import { cn } from '@/lib/utils';

interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Chip({
  children,
  selected = false,
  onClick,
  disabled = false,
  className,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors',
        selected
          ? 'border-brand-navy bg-brand-navy text-white'
          : 'border-border bg-white text-text-secondary hover:border-brand-navy hover:text-brand-navy',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}
