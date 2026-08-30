import React from 'react';
import { DailyReportModal } from './DailyReportModal';
import { useNavigate } from 'react-router-dom';

export const DailyReportingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-slate-50 relative overflow-hidden flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Daily Reporting</h1>
          <p className="text-sm text-slate-500 mt-1">Submit your end of day report metrics and checklist.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <DailyReportModal 
          mode="inline" 
          onSuccess={() => {
            // Optional: Show a toast here or navigate away
            navigate('/dashboard');
          }} 
        />
      </div>
    </div>
  );
};
