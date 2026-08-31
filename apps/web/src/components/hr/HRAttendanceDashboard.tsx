import React, { useState, useEffect } from 'react';
import { CalendarCheck, History, Activity, Search, ChevronRight } from 'lucide-react';
import { LiveAttendanceMonitor } from './LiveAttendanceMonitor';
import { AttendanceHistoryLog } from './AttendanceHistoryLog';
import { EmployeeAttendanceSummary } from './EmployeeAttendanceSummary';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { EmployeeListItem } from '../../types';

export const HRAttendanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIVE_TODAY' | 'HISTORY'>('LIVE_TODAY');
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{id: number; name: string} | null>(null);
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/employees?limit=1000`);
        const json = await res.json();
        if (res.ok) {
          setEmployees(json.employees || []);
        }
      } catch (err) {
        console.error('Failed to fetch employees', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(e => {
    const name = e.full_name || e.fullName || '';
    const code = e.employee_code || e.employeeCode || '';
    return name.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-navy-700/30">
        <div className="flex items-center gap-3 mb-2">
          <CalendarCheck className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-extrabold tracking-tight">Attendance Hub</h1>
        </div>
        <p className="text-sm text-navy-200/80 max-w-2xl">
          Monitor real-time punches, view individual monthly attendance summaries, and search the global history log.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl shadow-sm px-6 pt-4">
        <button
          onClick={() => setActiveTab('LIVE_TODAY')}
          className={`pb-4 px-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'LIVE_TODAY' ? 'border-navy-600 text-navy-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Activity className="w-4 h-4" />
          Live Today
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-4 px-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-navy-600 text-navy-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <History className="w-4 h-4" />
          Global History Log
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'LIVE_TODAY' && (
          <div className="space-y-6">
            <LiveAttendanceMonitor />

            {/* Employee List Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Employee Directory</h3>
                  <p className="text-xs text-slate-500">Select an employee to view their individual monthly attendance calculations.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or code..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500 outline-none w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-slate-500 animate-pulse">Loading employees...</div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No employees found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 border-t border-slate-100">
                    {filteredEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmployee({ id: emp.id, name: emp.full_name || emp.fullName || emp.employee_code || emp.employeeCode || 'Unknown' })}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors md:border-b md:border-r border-slate-100 last:border-b-0 text-left"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{emp.full_name || emp.fullName}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{emp.employee_code || emp.employeeCode}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <AttendanceHistoryLog />
        )}
      </div>

      {/* Modal */}
      {selectedEmployee && (
        <EmployeeAttendanceSummary
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
};
