import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { TaskManager } from '../tasks/TaskManager';
import { Briefcase, Calendar, TrendingUp } from 'lucide-react';
import { StatCard } from '../ui';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">My Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <strong className="text-navy-700">{user?.fullName || user?.employeeCode}</strong>. Manage your tasks and performance.
          </p>
        </div>
      </div>
      
      {/* Primary KPI Row - Data not currently fetched by this component, using placeholders for now */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="My Tasks" 
          value="—" 
          icon={Briefcase} 
        />
        <StatCard 
          label="My Attendance" 
          value="—" 
          icon={Calendar} 
        />
        <StatCard 
          label="Performance Score" 
          value="—" 
          icon={TrendingUp} 
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
          <PerformanceScoreWidget />
        </div>
      </div>
    </div>
  );
};
