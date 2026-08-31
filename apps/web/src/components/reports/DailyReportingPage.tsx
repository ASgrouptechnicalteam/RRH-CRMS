import React from 'react';
import { DailyReportModal } from './DailyReportModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const DailyReportingPage: React.FC = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  return (
    <div className="h-full bg-slate-50 relative overflow-hidden flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Daily Reporting</h1>
          <p className="text-sm text-slate-500 mt-1">Submit your end of day report metrics and checklist.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {isLoggingOut ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-50">
            <div className="w-12 h-12 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-lg font-bold text-slate-800">Report Submitted!</h2>
            <p className="text-sm text-slate-500">Logging you out securely...</p>
          </div>
        ) : null}

        <DailyReportModal 
          mode="inline" 
          onSuccess={() => {
            setIsLoggingOut(true);
            setTimeout(() => {
              logout();
            }, 1500); // Small delay to let user read the success message
          }} 
        />
      </div>
    </div>
  );
};
