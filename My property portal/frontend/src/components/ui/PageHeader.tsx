import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: string[];
}

export const PageHeader = ({ title, subtitle, action, breadcrumb }: PageHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
    <div>
      {breadcrumb && (
        <p className="text-xs text-slate-400 mb-1.5 tracking-wide uppercase font-medium">
          {breadcrumb.join(' / ')}
        </p>
      )}
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
