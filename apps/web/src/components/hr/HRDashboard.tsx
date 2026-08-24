import React, { useState } from 'react';
import { Users, Clock, CalendarCheck, ShieldAlert } from 'lucide-react';
import { EmployeeManagement } from '../employees/EmployeeManagement';
import { LateLeaveProposals } from '../attendance/LateLeaveProposals';
import { LiveAttendanceMonitor } from './LiveAttendanceMonitor';
import { AttendanceHistory } from './AttendanceHistory';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Roles } from '@rrh-ems/shared';

export const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'employees' | 'proposals' | 'attendance' | 'history'>(
    'employees',
  );

  const canManageEmployees = user?.roles?.some(
    (r) => r === Roles.MD || r === Roles.HR_MANAGER || r === Roles.ADMIN,
  );

  if (!canManageEmployees) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-600" />
          HR & Team Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage employee profiles, approve leaves, and monitor daily attendance.
        </p>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mt-6 pb-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'employees'
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            Employee Directory
          </button>

          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'proposals'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Late & Leave Approvals
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'attendance'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Live Attendance (Today)
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'history'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Clock className="w-4 h-4" />
            Attendance History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'employees' && <EmployeeManagement />}
        {activeTab === 'proposals' && <LateLeaveProposals />}
        {activeTab === 'attendance' && <LiveAttendanceMonitor />}
        {activeTab === 'history' && <AttendanceHistory />}
      </div>
    </div>
  );
};
