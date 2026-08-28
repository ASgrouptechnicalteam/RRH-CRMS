import React from 'react';

type StatusType = 'hot' | 'warm' | 'cold' | 'success' | 'pending' | 'danger' | 'default';

interface StatusPillProps {
  status: string; // The text to display
  type: StatusType;
}

export function StatusPill({ status, type }: StatusPillProps) {
  const styles: Record<StatusType, string> = {
    hot: 'bg-hot-100 text-hot-600',
    warm: 'bg-warm-100 text-warm-700',
    cold: 'bg-cold-100 text-cold-700',
    success: 'bg-success-100 text-success-700',
    pending: 'bg-pending-100 text-pending-700',
    danger: 'bg-danger-100 text-danger-700',
    default: 'bg-navy-100 text-navy-700'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[type] || styles.default}`}>
      {status}
    </span>
  );
}
