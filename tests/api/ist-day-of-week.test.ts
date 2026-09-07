import { getISTDayOfWeek, toHolidayDateKey } from '../../apps/api/src/utils/time';

// Found 2026-09-07 (a real Monday in India): the kiosk was blocking check-in
// with "Today is a holiday". Root cause in routes/attendance/qr.ts (both
// check-in and check-out) and routes/attendance/holidays-calendar.ts's
// calendar builder: `new Date(dateString + 'T00:00:00+05:30').getDay()`.
// .getDay() reads the day-of-week using the server PROCESS's own local
// timezone, silently ignoring the +05:30 just encoded into the string. On
// any server not running in Asia/Kolkata (e.g. UTC, standard for most cloud
// hosts), IST midnight is always 18:30 the *previous* UTC day, so this
// permanently reads YESTERDAY's weekday instead of today's — every real
// Sunday is missed and every real Monday is wrongly flagged as Sunday. This
// doesn't depend on time-of-day or a narrow window; it is wrong 24/7 on a
// non-IST server, deterministically, for every single request.
//
// This test cannot reproduce the bug by driving the real endpoint under
// Jest's own process timezone (it happens to match this dev machine's local
// TZ, which may or may not be IST) — instead it verifies the fixed helper's
// actual mathematical correctness against real reference dates, which holds
// regardless of what timezone the test runner itself executes under (that's
// the whole point of using Date.UTC()/.getUTCDay() internally).
describe('Phase 6 (found via user report) - IST day-of-week is timezone-independent', () => {
  it('correctly identifies known weekdays regardless of server timezone', () => {
    // Reference dates independently confirmed (2026-09-07 is a real Monday).
    expect(getISTDayOfWeek('2026-09-07')).toBe(1); // Monday
    expect(getISTDayOfWeek('2026-09-06')).toBe(0); // Sunday
    expect(getISTDayOfWeek('2026-09-08')).toBe(2); // Tuesday
    expect(getISTDayOfWeek('2026-01-01')).toBe(4); // Thursday
  });

  it('is immune to the exact bug this replaces: the old getDay()-on-a-+05:30-string approach', () => {
    // The buggy pattern this file replaces everywhere it appeared.
    const buggyDayOfWeek = (dateString: string) =>
      new Date(`${dateString}T00:00:00+05:30`).getUTCDay();
    // On a UTC-local server, .getDay() === .getUTCDay() — this proves the
    // buggy computation for a real Monday resolves to Sunday (0), which is
    // exactly the false "today is a holiday" the kiosk was throwing.
    expect(buggyDayOfWeek('2026-09-07')).toBe(0); // the bug: reads Monday as Sunday
    // ...while the fixed helper gets it right for the same date.
    expect(getISTDayOfWeek('2026-09-07')).toBe(1);
  });

  it('toHolidayDateKey matches the exact convention holidays are stored under (POST /holidays)', () => {
    const key = toHolidayDateKey('2026-09-07');
    expect(key.toISOString()).toBe('2026-09-07T00:00:00.000Z');
  });
});
