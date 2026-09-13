import { prisma } from '../../apps/api/src/lib/prisma';
import { jobManager } from '../../apps/api/src/jobs/index';
import '../../apps/api/src/jobs/scheduler'; // registers all jobs, including 'Daily Attendance Rollup'
import {
  getISTComponents,
  getISTMidnightInstant,
  getISTDayOfWeek,
} from '../../apps/api/src/utils/time';
import { dailyAttendanceRollupJob } from '../../apps/api/src/jobs/tasks';
import { Roles } from '@rrh-ems/shared';

// The job's own day boundary -- computing fixture timestamps relative to
// this (not a raw wall-clock offset like "now - 20h") keeps the test correct
// no matter what time of day it actually runs. A "now - 20h" check-in, for
// example, falls outside the job's [yesterday, today) window whenever the
// test happens to run late in the IST day -- exactly the kind of
// server-local-time assumption this session has repeatedly found and fixed.
const todaysMidnightIST = getISTMidnightInstant(getISTComponents(new Date()).dateString);
const wellWithinYesterday = new Date(todaysMidnightIST.getTime() - 2 * 60 * 60 * 1000); // 22:00 IST yesterday

// Every test in this file invokes dailyAttendanceRollupJob, whose Part 2
// (uninformed-absence detection) scans every company system-wide -- correct
// for production (only 2 real companies) but this shared test DB has
// accumulated many leftover fixture companies over this session's other
// test files, so a full pass can occasionally exceed Jest's default 10s.
jest.setTimeout(30000);

// Feature: at midnight, force-checkout any employee still checked in, and
// notify HR (falling back to MD when the company has no HR_MANAGER employee
// onboarded). This regression-guards dailyAttendanceRollupJob, which was
// previously a stub that did nothing (apps/api/src/jobs/tasks.ts).
describe('Midnight auto-checkout job + HR/MD escalation', () => {
  const companyWithHRCode = `TEST-MIDNIGHT-HR-${Date.now()}`;
  const companyWithoutHRCode = `TEST-MIDNIGHT-NOHR-${Date.now()}`;
  let companyWithHR: any;
  let companyWithoutHR: any;
  let hrEmployee: any;
  let mdEmployee: any;
  let openEmployeeA: any;
  let openEmployeeB: any;
  let openLogA: any;
  let openLogB: any;
  let alreadyClosedLog: any;

  beforeAll(async () => {
    companyWithHR = await prisma.company.create({
      data: { name: 'Midnight Test Co (has HR)', code: companyWithHRCode },
    });
    companyWithoutHR = await prisma.company.create({
      data: { name: 'Midnight Test Co (no HR)', code: companyWithoutHRCode },
    });

    const hrRole = await prisma.role.upsert({
      where: { name: Roles.HR_MANAGER },
      update: {},
      create: { name: Roles.HR_MANAGER },
    });
    const mdRole = await prisma.role.upsert({
      where: { name: Roles.MD },
      update: {},
      create: { name: Roles.MD },
    });

    hrEmployee = await prisma.employee.create({
      data: {
        employee_code: `MIDNIGHT-HR-${Date.now()}`,
        company_id: companyWithHR.id,
        password_hash: '',
        status: 'ACTIVE',
        // Not a subject of the uninformed-absence scan below (Part 2) --
        // they're only here to receive notifications, not to be checked in.
        attendance_required: false,
        full_name: 'Midnight Test HR Manager',
      },
    });
    await prisma.employeeRole.create({ data: { employee_id: hrEmployee.id, role_id: hrRole.id } });

    mdEmployee = await prisma.employee.create({
      data: {
        employee_code: `MIDNIGHT-MD-${Date.now()}`,
        company_id: companyWithoutHR.id,
        password_hash: '',
        status: 'ACTIVE',
        attendance_required: false,
        full_name: 'Midnight Test MD',
      },
    });
    await prisma.employeeRole.create({ data: { employee_id: mdEmployee.id, role_id: mdRole.id } });

    openEmployeeA = await prisma.employee.create({
      data: {
        employee_code: `MIDNIGHT-EMP-A-${Date.now()}`,
        company_id: companyWithHR.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Midnight Test Forgot-Checkout A',
      },
    });
    openEmployeeB = await prisma.employee.create({
      data: {
        employee_code: `MIDNIGHT-EMP-B-${Date.now()}`,
        company_id: companyWithoutHR.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Midnight Test Forgot-Checkout B',
      },
    });

    openLogA = await prisma.attendanceLog.create({
      data: { employee_id: openEmployeeA.id, check_in_at: wellWithinYesterday, status: 'PRESENT' },
    });
    openLogB = await prisma.attendanceLog.create({
      data: { employee_id: openEmployeeB.id, check_in_at: wellWithinYesterday, status: 'PRESENT' },
    });
    // A log that's already checked out must be left untouched by the job.
    // Dated the day before yesterday, well outside the job's [yesterday,
    // today) window either way.
    alreadyClosedLog = await prisma.attendanceLog.create({
      data: {
        employee_id: openEmployeeA.id,
        check_in_at: new Date(todaysMidnightIST.getTime() - 32 * 60 * 60 * 1000),
        check_out_at: new Date(todaysMidnightIST.getTime() - 24 * 60 * 60 * 1000 - 60 * 60 * 1000),
        working_duration_minutes: 480,
        status: 'PRESENT',
      },
    });
  });

  afterAll(async () => {
    const allEmployeeIds = [hrEmployee.id, mdEmployee.id, openEmployeeA.id, openEmployeeB.id];
    await prisma.notification.deleteMany({ where: { employee_id: { in: allEmployeeIds } } });
    await prisma.auditEvent.deleteMany({
      where: { entity_id: { in: [openLogA.id, openLogB.id] }, entity_type: 'ATTENDANCE_LOG' },
    });
    // Part 2 (uninformed-absence detection) may have written EMPLOYEE-entity
    // audit events for openEmployeeA/B if their fixture check-in fell outside
    // what it considers "yesterday" -- clean those up too.
    await prisma.auditEvent.deleteMany({
      where: {
        entity_id: { in: allEmployeeIds },
        entity_type: 'EMPLOYEE',
        action: 'UNINFORMED_ABSENT',
      },
    });
    await prisma.attendanceLog.deleteMany({
      where: { id: { in: [openLogA.id, openLogB.id, alreadyClosedLog.id] } },
    });
    await prisma.employeeRole.deleteMany({
      where: { employee_id: { in: [hrEmployee.id, mdEmployee.id] } },
    });
    await prisma.employee.deleteMany({ where: { id: { in: allEmployeeIds } } });
    await prisma.company.deleteMany({
      where: { id: { in: [companyWithHR.id, companyWithoutHR.id] } },
    });
  });

  it('force-checks-out every open log, notifies HR when present, and falls back to MD when HR is not onboarded', async () => {
    await jobManager.trigger('Daily Attendance Rollup');

    const refreshedA = await prisma.attendanceLog.findUnique({ where: { id: openLogA.id } });
    const refreshedB = await prisma.attendanceLog.findUnique({ where: { id: openLogB.id } });
    expect(refreshedA?.check_out_at).not.toBeNull();
    expect(refreshedB?.check_out_at).not.toBeNull();
    expect(refreshedA?.working_duration_minutes).toBeGreaterThan(0);
    expect(refreshedB?.working_duration_minutes).toBeGreaterThan(0);

    // Untouched: already had a check-out before the job ran.
    const refreshedClosed = await prisma.attendanceLog.findUnique({
      where: { id: alreadyClosedLog.id },
    });
    expect(refreshedClosed?.working_duration_minutes).toBe(480);

    const auditA = await prisma.auditEvent.findFirst({
      where: {
        entity_type: 'ATTENDANCE_LOG',
        entity_id: openLogA.id,
        action: 'ATTENDANCE_AUTO_CHECKOUT_MIDNIGHT',
      },
    });
    const auditB = await prisma.auditEvent.findFirst({
      where: {
        entity_type: 'ATTENDANCE_LOG',
        entity_id: openLogB.id,
        action: 'ATTENDANCE_AUTO_CHECKOUT_MIDNIGHT',
      },
    });
    expect(auditA).not.toBeNull();
    expect(auditB).not.toBeNull();

    const hrNotification = await prisma.notification.findFirst({
      where: { employee_id: hrEmployee.id },
    });
    expect(hrNotification).not.toBeNull();
    expect(hrNotification?.message).toContain(openEmployeeA.full_name);

    const mdNotification = await prisma.notification.findFirst({
      where: { employee_id: mdEmployee.id },
    });
    expect(mdNotification).not.toBeNull();
    expect(mdNotification?.message).toContain(openEmployeeB.full_name);
  });

  it('running the job again is a no-op (already-closed logs are left alone)', async () => {
    await prisma.notification.deleteMany({
      where: { employee_id: { in: [hrEmployee.id, mdEmployee.id] } },
    });
    await jobManager.trigger('Daily Attendance Rollup');

    const hrNotificationAfterRerun = await prisma.notification.findFirst({
      where: { employee_id: hrEmployee.id },
    });
    expect(hrNotificationAfterRerun).toBeNull();
  });
});

// Found while verifying the performance-metric formula (a separate ask):
// UNINFORMED_ABSENT was read by /performance/my-score, /performance/team,
// and analytics.service.ts, but nothing anywhere ever wrote that AuditEvent
// -- the -2.0 penalty could never actually fire for any employee. This adds
// the missing write, folded into the same midnight job (Part 2).
//
// This job correctly skips Sundays (no absence penalty on a non-working
// day), which would make a test tied to the *real* current day flaky --
// it would fail for the right reason whenever "yesterday" really was a
// Sunday. Instead, find a guaranteed non-Sunday date a bit in the future
// and call the job directly with that as its reference date (dailyAttendanceRollupJob
// accepts an optional referenceDate for exactly this), so the test is
// deterministic regardless of which real-world day it runs on.
function findNonSundayDateString(startOffsetDays: number): string {
  let cursor = new Date(todaysMidnightIST.getTime() + startOffsetDays * 24 * 60 * 60 * 1000);
  let dateStr = getISTComponents(cursor).dateString;
  while (getISTDayOfWeek(dateStr) === 0) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    dateStr = getISTComponents(cursor).dateString;
  }
  return dateStr;
}
const fixedYesterdayDateStr = findNonSundayDateString(10);
const fixedYesterdayMidnight = getISTMidnightInstant(fixedYesterdayDateStr);
const fixedReferenceDate = new Date(fixedYesterdayMidnight.getTime() + 24 * 60 * 60 * 1000 + 1000); // just after "today's" midnight
const fixedWellWithinYesterday = new Date(fixedYesterdayMidnight.getTime() + 22 * 60 * 60 * 1000); // 22:00 IST on the fixed "yesterday"

describe('Midnight job Part 2 - uninformed absence detection', () => {
  describe('on a working day', () => {
    const companyCode = `TEST-ABSENT-${Date.now()}`;
    let company: any;
    let hrEmployee: any;
    let presentEmployee: any;
    let onLeaveEmployee: any;
    let absentEmployee: any;
    let presentLog: any;
    let leaveProposal: any;

    beforeAll(async () => {
      company = await prisma.company.create({
        data: { name: 'Uninformed Absence Test Co', code: companyCode },
      });
      const hrRole = await prisma.role.upsert({
        where: { name: Roles.HR_MANAGER },
        update: {},
        create: { name: Roles.HR_MANAGER },
      });

      hrEmployee = await prisma.employee.create({
        data: {
          employee_code: `ABSENT-HR-${Date.now()}`,
          company_id: company.id,
          password_hash: '',
          status: 'ACTIVE',
          attendance_required: false,
          full_name: 'Absence Test HR Manager',
        },
      });
      await prisma.employeeRole.create({
        data: { employee_id: hrEmployee.id, role_id: hrRole.id },
      });

      presentEmployee = await prisma.employee.create({
        data: {
          employee_code: `ABSENT-PRESENT-${Date.now()}`,
          company_id: company.id,
          password_hash: '',
          status: 'ACTIVE',
          full_name: 'Was Present',
        },
      });
      onLeaveEmployee = await prisma.employee.create({
        data: {
          employee_code: `ABSENT-LEAVE-${Date.now()}`,
          company_id: company.id,
          password_hash: '',
          status: 'ACTIVE',
          full_name: 'Was On Approved Leave',
        },
      });
      absentEmployee = await prisma.employee.create({
        data: {
          employee_code: `ABSENT-UNINFORMED-${Date.now()}`,
          company_id: company.id,
          password_hash: '',
          status: 'ACTIVE',
          full_name: 'Uninformed Absentee',
        },
      });

      presentLog = await prisma.attendanceLog.create({
        data: {
          employee_id: presentEmployee.id,
          check_in_at: fixedWellWithinYesterday,
          // Already checked out -- this employee must not also be picked up
          // by Part 1 (force-checkout), which would send its own competing
          // notification to hrEmployee and confuse this test's assertions.
          check_out_at: new Date(fixedWellWithinYesterday.getTime() + 60 * 60 * 1000),
          working_duration_minutes: 60,
          status: 'PRESENT',
        },
      });
      leaveProposal = await prisma.attendanceProposal.create({
        data: {
          employee_id: onLeaveEmployee.id,
          type: 'LEAVE',
          target_date: fixedWellWithinYesterday,
          reason: 'Test leave',
          status: 'APPROVED',
        },
      });
    });

    afterAll(async () => {
      const ids = [hrEmployee.id, presentEmployee.id, onLeaveEmployee.id, absentEmployee.id];
      await prisma.notification.deleteMany({ where: { employee_id: { in: ids } } });
      await prisma.auditEvent.deleteMany({
        where: { entity_type: 'EMPLOYEE', entity_id: { in: ids }, action: 'UNINFORMED_ABSENT' },
      });
      await prisma.attendanceProposal.delete({ where: { id: leaveProposal.id } });
      await prisma.attendanceLog.delete({ where: { id: presentLog.id } });
      await prisma.employeeRole.deleteMany({ where: { employee_id: hrEmployee.id } });
      await prisma.employee.deleteMany({ where: { id: { in: ids } } });
      await prisma.company.delete({ where: { id: company.id } });
    });

    it('flags only the employee with no log and no approved leave, and notifies HR', async () => {
      // Part 2 scans every company system-wide with active, attendance-required
      // staff (correct for production, which only has 2 real companies) --
      // but this shared test DB has accumulated many leftover fixture
      // companies from this session's other test files, so a full pass here
      // can occasionally exceed Jest's default 10s. Not a production concern.
      await dailyAttendanceRollupJob(fixedReferenceDate);

      const presentAudit = await prisma.auditEvent.findFirst({
        where: {
          entity_type: 'EMPLOYEE',
          entity_id: presentEmployee.id,
          action: 'UNINFORMED_ABSENT',
        },
      });
      const leaveAudit = await prisma.auditEvent.findFirst({
        where: {
          entity_type: 'EMPLOYEE',
          entity_id: onLeaveEmployee.id,
          action: 'UNINFORMED_ABSENT',
        },
      });
      const absentAudit = await prisma.auditEvent.findFirst({
        where: {
          entity_type: 'EMPLOYEE',
          entity_id: absentEmployee.id,
          action: 'UNINFORMED_ABSENT',
        },
      });

      expect(presentAudit).toBeNull();
      expect(leaveAudit).toBeNull();
      expect(absentAudit).not.toBeNull();

      const hrNotification = await prisma.notification.findFirst({
        where: { employee_id: hrEmployee.id },
      });
      expect(hrNotification).not.toBeNull();
      expect(hrNotification?.message).toContain(absentEmployee.full_name);
    });

    it('does not double-record the same absence on a second run', async () => {
      await dailyAttendanceRollupJob(fixedReferenceDate);
      const count = await prisma.auditEvent.count({
        where: {
          entity_type: 'EMPLOYEE',
          entity_id: absentEmployee.id,
          action: 'UNINFORMED_ABSENT',
        },
      });
      expect(count).toBe(1);
    });
  });
});

// User-reported flaw: attending but never submitting a daily report cost
// nothing. Folded into the same midnight job (Part 3) since it already scans
// every company's attendance for the day that just ended. Deliberately
// covers Part-Time employees too (per the requester) -- report_required is
// the only opt-out, same flag HR already uses elsewhere.
describe('Midnight job Part 3 - missing daily report detection', () => {
  const companyCode = `TEST-MISSINGREPORT-${Date.now()}`;
  let company: any;
  let hrEmployee: any;
  let submittedEmployee: any;
  let missedEmployee: any;
  let exemptEmployee: any;
  let partTimeMissedEmployee: any;
  let submittedLog: any;
  let missedLog: any;
  let exemptLog: any;
  let partTimeMissedLog: any;
  let dailyReport: any;

  beforeAll(async () => {
    company = await prisma.company.create({
      data: { name: 'Missing Report Test Co', code: companyCode },
    });
    const hrRole = await prisma.role.upsert({
      where: { name: Roles.HR_MANAGER },
      update: {},
      create: { name: Roles.HR_MANAGER },
    });

    hrEmployee = await prisma.employee.create({
      data: {
        employee_code: `MISSINGREPORT-HR-${Date.now()}`,
        company_id: company.id,
        password_hash: '',
        status: 'ACTIVE',
        attendance_required: false,
        full_name: 'Missing Report Test HR Manager',
      },
    });
    await prisma.employeeRole.create({ data: { employee_id: hrEmployee.id, role_id: hrRole.id } });

    submittedEmployee = await prisma.employee.create({
      data: {
        employee_code: `MISSINGREPORT-OK-${Date.now()}`,
        company_id: company.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Submitted Their Report',
      },
    });
    missedEmployee = await prisma.employee.create({
      data: {
        employee_code: `MISSINGREPORT-MISS-${Date.now()}`,
        company_id: company.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Forgot Their Report',
      },
    });
    exemptEmployee = await prisma.employee.create({
      data: {
        employee_code: `MISSINGREPORT-EXEMPT-${Date.now()}`,
        company_id: company.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Exempt From Reports',
        report_required: false,
      },
    });
    partTimeMissedEmployee = await prisma.employee.create({
      data: {
        employee_code: `MISSINGREPORT-PT-${Date.now()}`,
        company_id: company.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Part-Time Forgot Report',
        employment_type: 'PART_TIME',
      },
    });

    const checkedOut = new Date(fixedWellWithinYesterday.getTime() + 60 * 60 * 1000);
    submittedLog = await prisma.attendanceLog.create({
      data: {
        employee_id: submittedEmployee.id,
        check_in_at: fixedWellWithinYesterday,
        check_out_at: checkedOut,
        working_duration_minutes: 60,
        status: 'PRESENT',
      },
    });
    missedLog = await prisma.attendanceLog.create({
      data: {
        employee_id: missedEmployee.id,
        check_in_at: fixedWellWithinYesterday,
        check_out_at: checkedOut,
        working_duration_minutes: 60,
        status: 'PRESENT',
      },
    });
    exemptLog = await prisma.attendanceLog.create({
      data: {
        employee_id: exemptEmployee.id,
        check_in_at: fixedWellWithinYesterday,
        check_out_at: checkedOut,
        working_duration_minutes: 60,
        status: 'PRESENT',
      },
    });
    partTimeMissedLog = await prisma.attendanceLog.create({
      data: {
        employee_id: partTimeMissedEmployee.id,
        check_in_at: fixedWellWithinYesterday,
        check_out_at: checkedOut,
        working_duration_minutes: 60,
        status: 'PRESENT',
      },
    });

    dailyReport = await prisma.dailyReport.create({
      data: {
        employee_id: submittedEmployee.id,
        submitted_at: new Date(fixedWellWithinYesterday.getTime() + 30 * 60 * 1000),
        summary: 'Did the thing.',
      },
    });
  });

  afterAll(async () => {
    const ids = [
      hrEmployee.id,
      submittedEmployee.id,
      missedEmployee.id,
      exemptEmployee.id,
      partTimeMissedEmployee.id,
    ];
    await prisma.notification.deleteMany({ where: { employee_id: { in: ids } } });
    await prisma.auditEvent.deleteMany({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: { in: ids },
        action: { in: ['MISSING_DAILY_REPORT', 'UNINFORMED_ABSENT'] },
      },
    });
    await prisma.dailyReport.delete({ where: { id: dailyReport.id } });
    await prisma.attendanceLog.deleteMany({
      where: { id: { in: [submittedLog.id, missedLog.id, exemptLog.id, partTimeMissedLog.id] } },
    });
    await prisma.employeeRole.deleteMany({ where: { employee_id: hrEmployee.id } });
    await prisma.employee.deleteMany({ where: { id: { in: ids } } });
    await prisma.company.delete({ where: { id: company.id } });
  });

  it('flags only the employee who attended but never submitted a report, excluding the exempt and the report-submitted ones', async () => {
    await dailyAttendanceRollupJob(fixedReferenceDate);

    const submittedAudit = await prisma.auditEvent.findFirst({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: submittedEmployee.id,
        action: 'MISSING_DAILY_REPORT',
      },
    });
    const missedAudit = await prisma.auditEvent.findFirst({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: missedEmployee.id,
        action: 'MISSING_DAILY_REPORT',
      },
    });
    const exemptAudit = await prisma.auditEvent.findFirst({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: exemptEmployee.id,
        action: 'MISSING_DAILY_REPORT',
      },
    });

    expect(submittedAudit).toBeNull();
    expect(missedAudit).not.toBeNull();
    expect(exemptAudit).toBeNull();

    const notification = await prisma.notification.findFirst({
      where: { employee_id: missedEmployee.id },
    });
    expect(notification).not.toBeNull();
  });

  it('also flags a Part-Time employee who attended but did not submit a report', async () => {
    const partTimeAudit = await prisma.auditEvent.findFirst({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: partTimeMissedEmployee.id,
        action: 'MISSING_DAILY_REPORT',
      },
    });
    expect(partTimeAudit).not.toBeNull();
  });

  it('does not double-record the same missing-report flag on a second run', async () => {
    await dailyAttendanceRollupJob(fixedReferenceDate);
    const count = await prisma.auditEvent.count({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: missedEmployee.id,
        action: 'MISSING_DAILY_REPORT',
      },
    });
    expect(count).toBe(1);
  });
});

// User-reported flaw (#19): performance scoring didn't reflect actual daily
// work output at all, only attendance timing. Per the requester's own
// resolution ("if they completed all works in their account they need to
// get 1 pt"), operationalized as: submitted the daily report AND has zero
// open (PENDING/IN_PROGRESS/OVERDUE) tasks left as of end of day. Reuses
// submittedEmployee from the missing-report suite above (already has a
// report for fixedWellWithinYesterday) by giving it zero open tasks, and a
// second employee with an open task to confirm the bonus is correctly
// withheld.
describe('Midnight job Part 4 - "cleared their desk" bonus', () => {
  const companyCode = `TEST-CLEAREDDESK-${Date.now()}`;
  let company: any;
  let hrEmployee: any;
  let clearedEmployee: any;
  let stillBusyEmployee: any;
  let clearedLog: any;
  let busyLog: any;
  let clearedReport: any;
  let busyReport: any;
  let openTask: any;

  beforeAll(async () => {
    company = await prisma.company.create({
      data: { name: 'Cleared Desk Test Co', code: companyCode },
    });
    const hrRole = await prisma.role.upsert({
      where: { name: Roles.HR_MANAGER },
      update: {},
      create: { name: Roles.HR_MANAGER },
    });

    hrEmployee = await prisma.employee.create({
      data: {
        employee_code: `CLEAREDDESK-HR-${Date.now()}`,
        company_id: company.id,
        password_hash: '',
        status: 'ACTIVE',
        attendance_required: false,
        full_name: 'Cleared Desk Test HR Manager',
      },
    });
    await prisma.employeeRole.create({ data: { employee_id: hrEmployee.id, role_id: hrRole.id } });

    clearedEmployee = await prisma.employee.create({
      data: {
        employee_code: `CLEAREDDESK-OK-${Date.now()}`,
        company_id: company.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Cleared Their Desk',
      },
    });
    stillBusyEmployee = await prisma.employee.create({
      data: {
        employee_code: `CLEAREDDESK-BUSY-${Date.now()}`,
        company_id: company.id,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Still Has Open Tasks',
      },
    });

    const checkedOut = new Date(fixedWellWithinYesterday.getTime() + 60 * 60 * 1000);
    clearedLog = await prisma.attendanceLog.create({
      data: {
        employee_id: clearedEmployee.id,
        check_in_at: fixedWellWithinYesterday,
        check_out_at: checkedOut,
        working_duration_minutes: 60,
        status: 'PRESENT',
      },
    });
    busyLog = await prisma.attendanceLog.create({
      data: {
        employee_id: stillBusyEmployee.id,
        check_in_at: fixedWellWithinYesterday,
        check_out_at: checkedOut,
        working_duration_minutes: 60,
        status: 'PRESENT',
      },
    });
    clearedReport = await prisma.dailyReport.create({
      data: {
        employee_id: clearedEmployee.id,
        submitted_at: new Date(fixedWellWithinYesterday.getTime() + 30 * 60 * 1000),
        summary: 'All done.',
      },
    });
    busyReport = await prisma.dailyReport.create({
      data: {
        employee_id: stillBusyEmployee.id,
        submitted_at: new Date(fixedWellWithinYesterday.getTime() + 30 * 60 * 1000),
        summary: 'Still working.',
      },
    });
    openTask = await prisma.task.create({
      data: {
        title: 'An open task',
        assignee_id: stillBusyEmployee.id,
        created_by: stillBusyEmployee.id,
        status: 'PENDING',
        target_date: new Date(Date.now() + 86400000),
      },
    });
  });

  afterAll(async () => {
    const ids = [hrEmployee.id, clearedEmployee.id, stillBusyEmployee.id];
    await prisma.notification.deleteMany({ where: { employee_id: { in: ids } } });
    await prisma.auditEvent.deleteMany({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: { in: ids },
        action: { in: ['COMPLETED_ALL_WORK', 'MISSING_DAILY_REPORT', 'UNINFORMED_ABSENT'] },
      },
    });
    await prisma.task.delete({ where: { id: openTask.id } });
    await prisma.dailyReport.deleteMany({
      where: { id: { in: [clearedReport.id, busyReport.id] } },
    });
    await prisma.attendanceLog.deleteMany({ where: { id: { in: [clearedLog.id, busyLog.id] } } });
    await prisma.employeeRole.deleteMany({ where: { employee_id: hrEmployee.id } });
    await prisma.employee.deleteMany({ where: { id: { in: ids } } });
    await prisma.company.delete({ where: { id: company.id } });
  });

  it('awards the bonus only to the employee with a submitted report AND no open tasks', async () => {
    await dailyAttendanceRollupJob(fixedReferenceDate);

    const clearedAudit = await prisma.auditEvent.findFirst({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: clearedEmployee.id,
        action: 'COMPLETED_ALL_WORK',
      },
    });
    const busyAudit = await prisma.auditEvent.findFirst({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: stillBusyEmployee.id,
        action: 'COMPLETED_ALL_WORK',
      },
    });

    expect(clearedAudit).not.toBeNull();
    expect(busyAudit).toBeNull();

    const notification = await prisma.notification.findFirst({
      where: { employee_id: clearedEmployee.id },
    });
    expect(notification).not.toBeNull();
  });

  it('does not double-award the bonus on a second run', async () => {
    await dailyAttendanceRollupJob(fixedReferenceDate);
    const count = await prisma.auditEvent.count({
      where: {
        entity_type: 'EMPLOYEE',
        entity_id: clearedEmployee.id,
        action: 'COMPLETED_ALL_WORK',
      },
    });
    expect(count).toBe(1);
  });
});
