import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { getISTComponents } from '../utils/time';

/**
 * Auto-close cron job
 * Runs every day at 2:00 AM IST
 * Finds all active check-ins that are from a previous day and auto-closes them
 * with a default 9-hour shift duration.
 */
export const initAttendanceAutoClose = () => {
  console.log('[cron]: Initializing Attendance Auto-Close job');
  
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[cron]: Running Attendance Auto-Close job...');
      const now = new Date();
      const { dateString: todayString } = getISTComponents(now);

      const openLogs = await prisma.attendanceLog.findMany({
        where: { check_out_at: null },
      });

      let autoClosedCount = 0;

      for (const log of openLogs) {
        if (!log.check_in_at) continue;

        const { dateString: logDateString } = getISTComponents(new Date(log.check_in_at));
        
        if (logDateString !== todayString) {
          const checkInTime = new Date(log.check_in_at).getTime();
          const autoCheckOut = new Date(checkInTime + 9 * 60 * 60 * 1000);
          
          await prisma.attendanceLog.update({
            where: { id: log.id },
            data: {
              check_out_at: autoCheckOut,
              working_duration_minutes: 9 * 60,
              notes: 'SYSTEM_AUTO_CLOSE',
            },
          });
          autoClosedCount++;
        }
      }

      console.log(`[cron]: Attendance Auto-Close completed. Closed ${autoClosedCount} records.`);
    } catch (error) {
      console.error('[cron]: Error during Attendance Auto-Close job:', error);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
};
