import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** If provided, the card is clickable and navigates here */
  link?: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
    label: string;
  };
}

export function StatCard({ label, value, icon: Icon, link, trend }: StatCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) navigate(link);
  };

  return (
    <div
      onClick={link ? handleClick : undefined}
      className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between transition-all h-full ${
        link
          ? 'cursor-pointer hover:shadow-md hover:border-navy-300 hover:-translate-y-0.5 active:scale-[0.99]'
          : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-600 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-navy-900">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          link ? 'bg-gold-100 group-hover:bg-gold-200' : 'bg-gold-100'
        }`}>
          <Icon className="w-5 h-5 text-gold-600" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-semibold flex items-center ${trend.direction === 'up' ? 'text-success-700' : 'text-danger-700'}`}>
            {trend.direction === 'up' ? (
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {trend.value}
          </span>
          <span className="text-slate-500 ml-2">{trend.label}</span>
        </div>
      )}

      {link && (
        <div className="mt-3 text-xs font-semibold text-navy-500 flex items-center gap-1">
          View details →
        </div>
      )}
    </div>
  );
}
