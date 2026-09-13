import React from 'react';

export type StatusPillType =
  | 'hot'
  | 'warm'
  | 'cold'
  | 'success'
  | 'pending'
  | 'danger'
  | 'default'
  // Attendance-specific statuses (AttendanceHistoryLog, LiveAttendanceMonitor)
  | 'attendance-present'
  | 'attendance-late'
  | 'attendance-approved-late'
  | 'attendance-half-day'
  | 'attendance-approved-half-day'
  | 'attendance-absent';

interface StatusPillProps {
  status: string; // The text to display
  type: StatusPillType;
  // Attendance screens use a bordered, square-cornered badge rather than the
  // default rounded-full lead-status pill; set this to match that look.
  bordered?: boolean;
}

export function StatusPill({ status, type, bordered }: StatusPillProps) {
  const styles: Record<StatusPillType, string> = {
    hot: 'bg-hot-100 text-hot-600',
    warm: 'bg-warm-100 text-warm-700',
    cold: 'bg-cold-100 text-cold-700',
    success: 'bg-success-100 text-success-700',
    pending: 'bg-pending-100 text-pending-700',
    danger: 'bg-danger-100 text-danger-700',
    default: 'bg-navy-100 text-navy-700',
    'attendance-present': 'text-green-700 bg-green-50 border-green-200',
    'attendance-late': 'text-amber-700 bg-amber-50 border-amber-200',
    'attendance-approved-late': 'text-emerald-700 bg-emerald-50 border-emerald-200',
    'attendance-half-day': 'text-orange-700 bg-orange-50 border-orange-200',
    'attendance-approved-half-day': 'text-blue-700 bg-blue-50 border-blue-200',
    'attendance-absent': 'text-red-700 bg-red-50 border-red-200',
  };

  const shape = bordered
    ? 'inline-block px-2.5 py-1 rounded-lg border font-bold'
    : 'inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold';

  return <span className={`${shape} text-xs ${styles[type] || styles.default}`}>{status}</span>;
}
