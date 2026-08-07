import React, { useState } from 'react';
import { ShieldCheck, QrCode, ServerCrash } from 'lucide-react';
import { MDControlDashboard } from '../md/MDControlDashboard';
import { AdminAnalyticsPortal } from '../admin/AdminAnalyticsPortal';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const SystemControlHub: React.FC = () => {
  const { user } = useAuth();
  
  const isMD = user?.roles?.includes('MD');
  const isAdmin = user?.roles?.includes('Admin (Technical)');

  const [activeTab, setActiveTab] = useState<'md' | 'admin'>(
    isAdmin && !isMD ? 'admin' : 'md'
  );

  if (!isMD && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-rose-600" />
          System Control Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          High-security control portal for managing access codes and system diagnostics.
        </p>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mt-6 pb-2 border-b border-slate-100">
          {isMD && (
            <button
              onClick={() => setActiveTab('md')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
                activeTab === 'md' 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <QrCode className="w-4 h-4" />
              MD Access Codes
            </button>
          )}
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
                activeTab === 'admin' 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <ServerCrash className="w-4 h-4" />
              Technical Admin Portal
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'md' && isMD && <MDControlDashboard />}
        {activeTab === 'admin' && isAdmin && <AdminAnalyticsPortal />}
      </div>
    </div>
  );
};
