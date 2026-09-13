import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  note?: string;
}

export function MetricCard({ label, value, sub, trend, className = '', note }: MetricCardProps) {
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-secondary';

  return (
    <div className={`rounded-xl border border-border bg-white p-5 shadow-sm ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <p
        className="mt-2 text-3xl font-bold text-text-primary"
        style={{ fontFamily: 'var(--font-family-display)' }}
      >
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      {sub && <p className={`mt-1 text-sm ${trendColor}`}>{sub}</p>}
      {note && <p className="mt-2 text-xs text-text-muted italic">{note}</p>}
    </div>
  );
}
