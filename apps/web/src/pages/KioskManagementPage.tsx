import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Roles } from '@rrh-ems/shared';
import { KioskCredentialManagement } from '../components/system/KioskCredentialManagement';
import { ShieldCheck, MonitorSmartphone } from 'lucide-react';

export const KioskManagementPage: React.FC = () => {
  const { user } = useAuth();
  
  const isMD = user?.roles?.includes(Roles.MD);
  const isAdmin = user?.roles?.includes(Roles.ADMIN);

  if (!isMD && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-navy-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MonitorSmartphone className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-extrabold tracking-tight">Kiosk Management</h1>
          </div>
          <p className="text-sm text-navy-200/80">
            Dedicated portal to manage and secure physical attendance kiosks.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-950/50 rounded-full border border-navy-700">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-100">MD & Admin Access Only</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <KioskCredentialManagement />
      </div>
    </div>
  );
};
