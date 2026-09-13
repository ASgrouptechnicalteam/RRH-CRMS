import {
  calculateAttendanceStatus,
  calculateAttendancePoints,
} from '../../apps/api/src/utils/time';
import { AttendanceStatus } from '@rrh-ems/shared';

// User-reported flaw: "we are calculating time for up to half day only —
// half day should be calculated when an employee entered before 2pm, after
// 2pm there is no login [counting]." Before this fix, calculateAttendanceStatus
// had no upper bound at all past 11:30 AM — a 1pm and a 6pm check-in scored
// identically as HALF_DAY. Per the chosen resolution (still allow the scan,
// just stop counting it as a half-day), 2:00 PM IST is now the hard line:
// before it, HALF_DAY/APPROVED_HALF_DAY as before; at or after it, ABSENT
// (or APPROVED_HALF_DAY if an approval already covers the day).
describe('Attendance: 2pm cutoff for HALF_DAY vs ABSENT', () => {
  const istTime = (hh: number, mm: number) =>
    new Date(`2026-09-15T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+05:30`);

  it('11:31 AM (just past the late window) is still HALF_DAY', () => {
    expect(calculateAttendanceStatus(istTime(11, 31), false, 'FULL_TIME')).toBe(
      AttendanceStatus.HALF_DAY,
    );
  });

  it('1:59 PM is still HALF_DAY (one minute before the cutoff)', () => {
    expect(calculateAttendanceStatus(istTime(13, 59), false, 'FULL_TIME')).toBe(
      AttendanceStatus.HALF_DAY,
    );
  });

  it('exactly 2:00 PM is ABSENT, not HALF_DAY', () => {
    expect(calculateAttendanceStatus(istTime(14, 0), false, 'FULL_TIME')).toBe(
      AttendanceStatus.ABSENT,
    );
  });

  it('6:00 PM is also ABSENT — no longer indistinguishable from a 1pm check-in', () => {
    expect(calculateAttendanceStatus(istTime(18, 0), false, 'FULL_TIME')).toBe(
      AttendanceStatus.ABSENT,
    );
  });

  it('an approved proposal covering a 2pm+ check-in stays APPROVED_HALF_DAY, not ABSENT', () => {
    expect(calculateAttendanceStatus(istTime(15, 0), true, 'FULL_TIME')).toBe(
      AttendanceStatus.APPROVED_HALF_DAY,
    );
  });

  it('PART_TIME/CONTRACT/INTERN are unaffected by the cutoff — always PRESENT', () => {
    expect(calculateAttendanceStatus(istTime(18, 0), false, 'PART_TIME')).toBe(
      AttendanceStatus.PRESENT,
    );
  });

  it('ABSENT from a too-late check-in scores -2.0, not the lighter -1.0 half-day penalty', () => {
    expect(calculateAttendancePoints(AttendanceStatus.ABSENT, istTime(18, 0), 'FULL_TIME')).toBe(
      -2.0,
    );
    expect(calculateAttendancePoints(AttendanceStatus.HALF_DAY, istTime(12, 0), 'FULL_TIME')).toBe(
      -1.0,
    );
  });
});
