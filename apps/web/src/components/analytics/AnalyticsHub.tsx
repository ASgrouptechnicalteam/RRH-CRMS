import React, { useState } from 'react';
import { Target, Award, BarChart3 } from 'lucide-react';
import { TargetConfigurator } from '../targets/TargetConfigurator';
import { TeamPerformanceDashboard } from '../performance/TeamPerformanceDashboard';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const AnalyticsHub: React.FC = () => {
  const { user } = useAuth();
  
  const canManageTargets = user?.roles?.some(r => ['Managing director'].includes(r));
  const canViewTeamPerformance = user?.roles?.some(r =>
    ['Managing director', 'Admin (Technical)', 'marketing director', 'HR', 'project managers',
     'Digital Marketing head(manager)', 'accountant'].includes(r)
  );

  const [activeTab, setActiveTab] = useState<'performance' | 'targets'>(
    canViewTeamPerformance ? 'performance' : 'targets'
  );

  if (!canManageTargets && !canViewTeamPerformance) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-teal-600" />
          Analytics & Goals
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor team performance scores and configure monthly targets.
        </p>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mt-6 pb-2 border-b border-slate-100">
          {canViewTeamPerformance && (
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
                activeTab === 'performance' 
                  ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Award className="w-4 h-4" />
              Team Performance
            </button>
          )}
          
          {canManageTargets && (
            <button
              onClick={() => setActiveTab('targets')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
                activeTab === 'targets' 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Target className="w-4 h-4" />
              Target Configurator
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'performance' && canViewTeamPerformance && <TeamPerformanceDashboard />}
        {activeTab === 'targets' && canManageTargets && <TargetConfigurator />}
      </div>
    </div>
  );
};
