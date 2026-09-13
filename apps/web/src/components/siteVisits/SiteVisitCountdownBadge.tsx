import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SiteVisitCountdownBadgeProps {
  scheduledDate: string;
}

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(Math.abs(ms) / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/**
 * Live countdown to a site visit's scheduled time, using the exact same
 * thresholds the backend escalation job (dailyAttendanceRollupJob's sibling,
 * apps/api/src/jobs/tasks.ts's site-visit escalation loop) uses to notify
 * Marketing Director (≤12h) and MD (≤10h) when a visit is still unaccepted —
 * so a PM sees the same urgency here, live, instead of a static "PENDING"
 * pill that doesn't communicate how close the visit actually is.
 */
export const SiteVisitCountdownBadge: React.FC<SiteVisitCountdownBadgeProps> = ({
  scheduledDate,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(scheduledDate).getTime();
  const diffMs = target - now;
  const hoursUntil = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        Visit time passed
      </span>
    );
  }

  if (hoursUntil <= 10) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-200 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        {formatDuration(diffMs)} left (10H breach)
      </span>
    );
  }

  if (hoursUntil <= 12) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
        <AlertTriangle className="w-3 h-3" />
        {formatDuration(diffMs)} left (12H breach)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
      <Clock className="w-3 h-3" />
      {formatDuration(diffMs)} until visit
    </span>
  );
};
