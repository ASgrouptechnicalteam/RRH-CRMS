import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface AttendanceLog {
  id: number;
  check_in_at: string;
  status: string;
  source: string;
  employee: {
    full_name: string;
    employee_code: string;
  };
  branch_name?: string | null;
  checkout_branch_name?: string | null;
  isCrossBranch?: boolean;
}

export const LiveAttendanceMonitor: React.FC = () => {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveAttendance = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/live`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch attendance logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAttendance();
    const interval = setInterval(fetchLiveAttendance, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [accessToken]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'text-green-700 bg-green-50 border-green-200';
      case 'LATE': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'HALF_DAY': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'ABSENT': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading live attendance...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center space-y-4">
        <Clock className="w-12 h-12 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-700">No Scans Yet Today</h3>
        <p className="text-sm text-slate-500">Employees who scan the QR code today will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-navy-600" />
          Today's Check-ins
        </h3>
        <span className="text-xs font-semibold bg-navy-100 text-navy-800 px-2.5 py-1 rounded-full">
          {logs.length} Total
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {logs.map(log => (
          <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">
                {log.employee.full_name}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                <span>{log.employee.employee_code}</span>
                {log.branch_name && (
                  <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    {log.branch_name}
                  </span>
                )}
                {log.isCrossBranch && log.checkout_branch_name && (
                  <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 border border-red-200">
                    <AlertTriangle className="w-3 h-3" />
                    Out: {log.checkout_branch_name}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(log.status)}`}>
                {log.status.replace('_', ' ')}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                {new Date(log.check_in_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
