import {
  calculateAttendancePoints,
  calculateAttendanceStatus,
  PERFORMANCE_TIER_CUTOVER,
} from '../../apps/api/src/utils/time';

// § Phase 4 — the finer-grained morning scoring gradient had zero test
// coverage before this change (confirmed via a full-repo search), despite
// being the single most consequential number in the app (drives staff
// performance reviews). These are pure unit tests: no DB, no HTTP.

function istTime(hh: number, mm: number, dateStr = '2026-09-15'): Date {
  return new Date(
    `${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+05:30`,
  );
}

describe('calculateAttendancePoints (§ Phase 4 morning gradient)', () => {
  it('9:59 AM (before 10:00) earns full +1.0', () => {
    expect(calculateAttendancePoints('PRESENT', istTime(9, 59), 'FULL_TIME')).toBe(1.0);
  });

  it('10:00 AM exactly earns +0.5 (grace window starts)', () => {
    expect(calculateAttendancePoints('PRESENT', istTime(10, 0), 'FULL_TIME')).toBe(0.5);
  });

  it('10:14 AM earns +0.5 (still within grace window)', () => {
    expect(calculateAttendancePoints('PRESENT', istTime(10, 14), 'FULL_TIME')).toBe(0.5);
  });

  it('10:15 AM exactly earns 0.0 (neutral window starts)', () => {
    expect(calculateAttendancePoints('PRESENT', istTime(10, 15), 'FULL_TIME')).toBe(0.0);
  });

  it('10:29 AM earns 0.0 (still within the existing PRESENT cutoff)', () => {
    expect(calculateAttendancePoints('PRESENT', istTime(10, 29), 'FULL_TIME')).toBe(0.0);
  });

  it('10:30 AM exactly still counts as PRESENT (existing cutoff, unchanged) and earns 0.0', () => {
    // Confirms calculateAttendanceStatus's own cutoff (<=10:30 -> PRESENT) is untouched.
    expect(calculateAttendanceStatus(istTime(10, 30))).toBe('PRESENT');
    expect(calculateAttendancePoints('PRESENT', istTime(10, 30), 'FULL_TIME')).toBe(0.0);
  });

  it('10:31 AM is LATE (existing rule, unchanged) and the penalty is unaffected by this change', () => {
    expect(calculateAttendanceStatus(istTime(10, 31))).toBe('LATE');
    expect(calculateAttendancePoints('LATE', istTime(10, 31), 'FULL_TIME')).toBe(-1.0);
  });

  it('HALF_DAY (after 11:30) keeps the existing -1.0 penalty, unchanged by this phase', () => {
    expect(calculateAttendanceStatus(istTime(11, 45))).toBe('HALF_DAY');
    expect(calculateAttendancePoints('HALF_DAY', istTime(11, 45), 'FULL_TIME')).toBe(-1.0);
  });

  it('APPROVED_LATE is neutral (0.0) — the bug fix: previously scored identically to on-time (+0.5)', () => {
    expect(calculateAttendancePoints('APPROVED_LATE', istTime(10, 45), 'FULL_TIME')).toBe(0.0);
  });

  it('APPROVED_HALF_DAY is neutral (0.0) — no gain, no penalty', () => {
    expect(calculateAttendancePoints('APPROVED_HALF_DAY', istTime(12, 0), 'FULL_TIME')).toBe(0.0);
  });

  it('PART_TIME/CONTRACT/INTERN keep the flat +0.5 for PRESENT regardless of check-in time — the gradient is FULL_TIME-only', () => {
    expect(calculateAttendancePoints('PRESENT', istTime(11, 50), 'PART_TIME')).toBe(0.5);
    expect(calculateAttendancePoints('PRESENT', istTime(9, 0), 'CONTRACT')).toBe(0.5);
    expect(calculateAttendancePoints('PRESENT', istTime(9, 0), 'INTERN')).toBe(0.5);
  });

  it('"forward only": a PRESENT check-in before the cutover date keeps the old flat +0.5, even at an early time that would otherwise earn +1.0', () => {
    const beforeCutover = new Date(PERFORMANCE_TIER_CUTOVER.getTime() - 24 * 60 * 60 * 1000);
    expect(calculateAttendancePoints('PRESENT', beforeCutover, 'FULL_TIME')).toBe(0.5);
  });

  it('a PRESENT check-in exactly at/after the cutover date uses the new gradient', () => {
    expect(calculateAttendancePoints('PRESENT', PERFORMANCE_TIER_CUTOVER, 'FULL_TIME')).toBe(1.0); // midnight IST -> before 10 AM
  });

  it('leave is untouched by this function entirely — an approved LEAVE never creates an AttendanceLog row, so ABSENT/other statuses are simply neutral here', () => {
    expect(calculateAttendancePoints('ABSENT', null, 'FULL_TIME')).toBe(0.0);
  });

  it('defensive fallback: a null check-in timestamp on a PRESENT log does not earn the top tier by accident', () => {
    expect(calculateAttendancePoints('PRESENT', null, 'FULL_TIME')).toBe(0.5);
  });
});
