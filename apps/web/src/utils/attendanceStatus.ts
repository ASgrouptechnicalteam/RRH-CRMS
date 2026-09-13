import { StatusPillType } from '../components/ui/StatusPill';

// Shared mapping from an AttendanceLog.status value to the StatusPill
// variant that renders it — used by AttendanceHistoryLog and
// LiveAttendanceMonitor so both screens color attendance statuses the same
// way instead of each hand-rolling its own getStatusColor switch.
export function attendanceStatusToPillType(status: string): StatusPillType {
  switch (status) {
    case 'PRESENT':
      return 'attendance-present';
    case 'LATE':
      return 'attendance-late';
    case 'APPROVED_LATE':
      return 'attendance-approved-late';
    case 'HALF_DAY':
      return 'attendance-half-day';
    case 'APPROVED_HALF_DAY':
      return 'attendance-approved-half-day';
    case 'ABSENT':
      return 'attendance-absent';
    default:
      return 'default';
  }
}
