import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    direction: 'up' | 'down';
    value: string;
    label: string;
  };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-600 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-navy-900">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center shrink-0">
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
    </div>
  );
}
