import React from 'react';

export type StatusChipVariant =
  | 'live'
  | 'available'
  | 'reserved'
  | 'booked'
  | 'sold'
  | 'pending_approval'
  | 'in_progress';

export interface StatusChipProps {
  variant: StatusChipVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<StatusChipVariant, {
  bg: string;
  fg: string;
  border: string;
  icon: React.ReactNode;
}> = {
  live: {
    bg: 'var(--color-success)',
    fg: 'white',
    border: 'var(--color-success)',
    icon: (
      <span className="w-3 h-3 rounded-full" aria-hidden="true" />
    ),
  },
  available: {
    bg: 'var(--color-action-blue)',
    fg: 'white',
    border: 'var(--color-action-blue)',
    icon: (
      <span className="w-3 h-3 rounded-full" aria-hidden="true" />
    ),
  },
  reserved: {
    bg: 'var(--color-warning)',
    fg: 'var(--color-neutral-900)',
    border: 'var(--color-warning)',
    icon: (
      <span className="w-3 h-3 rounded-full" aria-hidden="true" />
    ),
  },
  booked: {
    bg: 'var(--color-navy)',
    fg: 'white',
    border: 'var(--color-navy)',
    icon: (
      <span className="w-3 h-3 rounded-full" aria-hidden="true" />
    ),
  },
  sold: {
    bg: 'var(--color-destructive)',
    fg: 'white',
    border: 'var(--color-destructive)',
    icon: (
      <span className="w-3 h-3 rounded-full" aria-hidden="true" />
    ),
  },
  pending_approval: {
    bg: 'var(--color-gold)',
    fg: 'var(--color-navy)',
    border: 'var(--color-gold)',
    icon: (
      <span className="w-3 h-3 rounded-full" aria-hidden="true" />
    ),
  },
  in_progress: {
    bg: 'var(--color-info)',
    fg: 'var(--color-neutral-900)',
    border: 'var(--color-info)',
    icon: (
      <span className="w-3 h-3 rounded-full" aria-hidden="true" />
    ),
  },
};

const sizeStyles = {
  sm: { padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' },
  md: { padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' },
};

const StatusChip: React.FC<StatusChipProps> = ({
  variant,
  size = 'md',
  className,
}) => {
  const { bg, fg, border, icon } = variantStyles[variant];
  const pkgSize = sizeStyles[size as keyof typeof sizeStyles];

  return (
    <span
      className="inline-flex items-center rounded-full"
      role="status"
      aria-live="polite"
      aria-label={`Status: ${variant.replace(/_/g, ' ')}`}
    >
      {icon}
      <span className="ml-1 align-middle">{variant.replace(/_/g, ' ')}</span>
    </span>
  );
};

export { StatusChip };