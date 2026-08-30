import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { TaskManager } from '../tasks/TaskManager';
import { Briefcase, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { StatCard } from '../ui';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showOps, setShowOps] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">My Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <strong className="text-navy-700">{user?.fullName || user?.employeeCode}</strong>. Manage your pipeline and tasks.
          </p>
        </div>
      </div>
      
      {/* Primary KPI Row - CRM Focused */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="My Active Leads" 
          value="—" 
          icon={Users} 
        />
        <StatCard 
          label="Upcoming Visits" 
          value="—" 
          icon={Calendar} 
        />
        <StatCard 
          label="My Tasks" 
          value="—" 
          icon={Briefcase} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-navy-900 mb-4">Task Management</h3>
            <TaskManager />
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Operational Widgets moved to a collapsible section or secondary view */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            <button 
              onClick={() => setShowOps(!showOps)}
              className="w-full flex items-center justify-between p-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span>Operational Metrics (Attendance & Performance)</span>
              {showOps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showOps && (
              <div className="p-4 border-t border-slate-200 bg-white">
                <PerformanceScoreWidget />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
