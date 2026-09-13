import React from 'react';

type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'late'
  | 'booked'
  | 'available'
  | 'sold'
  | string;

const variantMap: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  processing: 'bg-amber-50 text-amber-700 border border-amber-200',
  booked: 'bg-blue-50 text-blue-700 border border-blue-200',
  registered: 'bg-blue-50 text-blue-700 border border-blue-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  late: 'bg-red-50 text-red-700 border border-red-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  inactive: 'bg-slate-100 text-slate-600 border border-slate-200',
  sold: 'bg-purple-50 text-purple-700 border border-purple-200',
  resale: 'bg-purple-50 text-purple-700 border border-purple-200',
};

export const StatusBadge = ({ status }: { status: string }) => {
  const key = status.toLowerCase().replace(/\s+/g, '');
  const cls = variantMap[key] || 'bg-slate-100 text-slate-600 border border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
};
