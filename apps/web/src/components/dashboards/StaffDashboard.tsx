import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { TaskManager } from '../tasks/TaskManager';
import { Activity } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center gap-4 border border-slate-700">
        <div className="p-3 bg-white/10 rounded-2xl">
          <Activity className="w-8 h-8 text-navy-400" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">My Work</h2>
          <p className="text-xs text-slate-300">
            Welcome back, <strong className="text-white">{user?.employeeCode}</strong>. Manage your tasks and view your performance metrics.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <TaskManager />
        </div>
        <div>
          <PerformanceScoreWidget />
        </div>
      </div>
    </div>
  );
};
