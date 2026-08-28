import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ActiveSiteVisitsBanner } from '../siteVisits/ActiveSiteVisitsBanner';

export const AgentSiteVisitsDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Agent Field Operations</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, {user?.fullName || user?.employeeCode}. Here are your assigned site visits.
          </p>
        </div>
      </div>

      <ActiveSiteVisitsBanner />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center text-slate-500">
        Agent dashboard components are under construction.
      </div>
    </div>
  );
};
