import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { Search, Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle, Edit } from 'lucide-react';
import { ManualCorrectionModal } from './ManualCorrectionModal';
import { AttendanceOverrideModal } from './AttendanceOverrideModal';

interface AttendanceLog {
  id: number;
  check_in_at: string;
  check_out_at: string | null;
  working_duration_minutes: number | null;
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

export const AttendanceHistory: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [overrideLog, setOverrideLog] = useState<AttendanceLog | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) query.append('search', search);
      if (status) query.append('status', status);
      if (date) {
        query.append('startDate', date);
        query.append('endDate', date);
      }

      const res = await fetch(`${API_BASE_URL}/attendance/history?${query.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch attendance history');
      const data = await res.json();
      
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, status, date, accessToken]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'text-green-700 bg-green-50 border-green-200';
      case 'LATE': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'HALF_DAY': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'ABSENT': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Header & Filters */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Attendance History</h3>
          
          {user && (user.roles.includes('HR_MANAGER') || user.roles.includes('MD') || user.roles.includes('ADMIN')) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-navy-200"
            >
              <Edit className="w-4 h-4" />
              Mark Absent/Late
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
          </div>
          
          <div className="flex gap-3 flex-1 sm:flex-none">
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 text-slate-600"
            />
            
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 text-slate-600"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-auto min-h-[300px]">
        {isLoading && logs.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-slate-500 animate-pulse">
            Loading records...
          </div>
        ) : error ? (
          <div className="m-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
            <Calendar className="w-10 h-10 opacity-50" />
            <p>No attendance records found for this filter.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Employee</th>
                <th className="px-6 py-3 font-semibold">Date & Check-In</th>
                <th className="px-6 py-3 font-semibold">Check-Out</th>
                <th className="px-6 py-3 font-semibold">Duration</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                {user && (user.roles.includes('HR_MANAGER') || user.roles.includes('MD') || user.roles.includes('ADMIN')) && (
                  <th className="px-6 py-3 font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                const inTime = new Date(log.check_in_at);
                const outTime = log.check_out_at ? new Date(log.check_out_at) : null;
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-bold text-slate-800">{log.employee.full_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>{log.employee.employee_code}</span>
                        {log.branch_name && (
                          <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                            {log.branch_name}
                          </span>
                        )}
                        {log.isCrossBranch && log.checkout_branch_name && (
                          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 border border-red-200">
                            <AlertCircle className="w-3 h-3" />
                            Out: {log.checkout_branch_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-slate-700">{inTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {inTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {outTime ? (
                        <div className="text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {outTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-1 bg-navy-50 text-navy-600 rounded-md border border-navy-100">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {log.working_duration_minutes !== null ? (
                        <span className="font-semibold text-slate-700">
                          {Math.floor(log.working_duration_minutes / 60)}h {log.working_duration_minutes % 60}m
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(log.status)}`}>
                          {log.status.replace('_', ' ')}
                        </div>
                        {log.source === 'HR_MANUAL' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded">
                            HR Manual
                          </span>
                        )}
                      </div>
                    </td>
                    {user && (user.roles.includes('HR_MANAGER') || user.roles.includes('MD') || user.roles.includes('ADMIN')) && (
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setOverrideLog(log)}
                          className="p-1.5 text-slate-400 hover:text-navy-600 hover:bg-navy-50 rounded transition-colors"
                          title="Edit Attendance Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ManualCorrectionModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchHistory();
          }}
        />
      )}

      {overrideLog && (
        <AttendanceOverrideModal
          log={overrideLog}
          onClose={() => setOverrideLog(null)}
          onSuccess={() => {
            setOverrideLog(null);
            fetchHistory();
          }}
        />
      )}
    </div>
  );
};
