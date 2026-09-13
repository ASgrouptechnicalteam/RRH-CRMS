import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'purple' | 'slate';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
    label: 'text-blue-500',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
    label: 'text-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
    label: 'text-amber-500',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-700',
    label: 'text-red-500',
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-indigo-100 text-indigo-600',
    value: 'text-indigo-700',
    label: 'text-indigo-500',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-700',
    label: 'text-purple-500',
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'bg-slate-100 text-slate-600',
    value: 'text-slate-700',
    label: 'text-slate-500',
  },
};

export const StatCard = ({ title, value, subtext, icon: Icon, color }: StatCardProps) => {
  const c = colorMap[color];
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className={`p-3 rounded-xl ${c.icon} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
          {title}
        </p>
        <p className={`text-2xl font-bold ${c.value} mt-0.5`}>{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  );
};
