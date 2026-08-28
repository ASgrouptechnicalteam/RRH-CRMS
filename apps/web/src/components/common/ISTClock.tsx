import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const ISTClock: React.FC = () => {
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time in Asia/Kolkata (IST)
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const optionsDate: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };

      setTimeString(new Intl.DateTimeFormat('en-US', optionsTime).format(now));
      setDateString(new Intl.DateTimeFormat('en-US', optionsDate).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs text-slate-700 font-mono shadow-inner">
      <Clock className="w-3.5 h-3.5 text-navy-700 animate-pulse" />
      <div>
        <span className="font-bold text-navy-900">{timeString} IST</span>
        <span className="text-[10px] text-slate-500 ml-2 border-l border-slate-300 pl-2">{dateString}</span>
      </div>
    </div>
  );
};
