import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  TrendingUp,
  Building,
  Network,
  MapPin,
  CheckSquare,
  Award,
  ShieldCheck,
  Menu,
  X,
  User,
  Clock,
  Users,
  Target,
  IndianRupee
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeTab = location.pathname.replace('/', '') || 'dashboard';

  const isMD = user?.roles?.includes('MD');
  const isAdmin = user?.roles?.includes('Admin (Technical)');
  const canManageEmployees = user?.roles?.some((r) => ['MD', 'HR Manager', 'Admin (Technical)'].includes(r));
  const canViewTeamPerformance = user?.roles?.some(r =>
    ['MD', 'Admin (Technical)', 'Marketing Director', 'HR Manager', 'Project Manager',
     'Channel Partner Manager', 'Digital Marketing Head', 'Finance / Accountant'].includes(r)
  );
  const canManageTargets = user?.roles?.some(r => ['MD', 'Marketing Director', 'Admin (Technical)'].includes(r));

  const handleNav = (path: string) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Dim Overlay for Drawer */}
      {isDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Side Drawer for 'More' Menu */}
      <div 
        className={`md:hidden fixed inset-y-0 right-0 w-64 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="font-bold text-slate-800 text-sm">Navigation Menu</h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button onClick={() => handleNav('/profile')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <User className="w-4 h-4" /> My Profile
          </button>

          <div className="my-2 border-t border-slate-100" />

          {/* Moved from bottom nav */}
          <button onClick={() => handleNav('/tasks')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'tasks' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <CheckSquare className="w-4 h-4" /> Task Manager
          </button>
          <button onClick={() => handleNav('/site-visits')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'site-visits' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <MapPin className="w-4 h-4" /> Site Visits
          </button>

          <div className="my-2 border-t border-slate-100" />

          {/* Advanced / Consolidated Hubs */}
          {canManageEmployees && (
            <button onClick={() => handleNav('/hr-hub')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'hr-hub' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users className="w-4 h-4" /> HR & Team Hub
            </button>
          )}

          {(canViewTeamPerformance || canManageTargets) && (
            <button onClick={() => handleNav('/analytics')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'analytics' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Target className="w-4 h-4" /> Analytics & Goals
            </button>
          )}

          <div className="my-2 border-t border-slate-100" />

          {/* Finance */}
          <button onClick={() => handleNav('/finance')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'finance' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <IndianRupee className="w-4 h-4" /> Finance
          </button>

          {/* Keeping legacy proposals button for standard users if they don't have HR Hub */}
          {!canManageEmployees && (
            <button onClick={() => handleNav('/proposals')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'proposals' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Clock className="w-4 h-4" /> My Proposals
            </button>
          )}

          <div className="my-2 border-t border-slate-100" />

          {(isMD || isAdmin) && (
            <button onClick={() => handleNav('/system-control')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'system-control' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>
              <ShieldCheck className="w-4 h-4" /> System Control
            </button>
          )}
        </div>
      </div>

      {/* Main Bottom Nav Bar (Max 5 Icons) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-between text-white shadow-2xl">
        <button
          onClick={() => handleNav('/dashboard')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all ${
            activeTab === 'dashboard' ? 'text-teal-400 font-extrabold bg-teal-950/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-[9px]">Home</span>
        </button>

        <button
          onClick={() => handleNav('/leads')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all ${
            activeTab === 'leads' ? 'text-teal-400 font-extrabold bg-teal-950/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px]">Leads</span>
        </button>

        {user?.roles?.some(r => ['MD', 'Admin (Technical)', 'Marketing Director', 'Project Manager'].includes(r)) && (
          <button
            onClick={() => handleNav('/properties')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all ${
              activeTab === 'properties' ? 'text-teal-400 font-extrabold bg-teal-950/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-5 h-5" />
            <span className="text-[9px]">Properties</span>
          </button>
        )}

        {user?.roles?.some(r => ['MD', 'Admin (Technical)', 'Marketing Director', 'Channel Partner Manager', 'Finance / Accountant'].includes(r)) && (
          <button
            onClick={() => handleNav('/cp')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all ${
              activeTab === 'cp' ? 'text-amber-400 font-extrabold bg-amber-950/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-5 h-5" />
            <span className="text-[9px]">Network</span>
          </button>
        )}

        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all ${
            isDrawerOpen ? 'text-white font-extrabold bg-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px]">More</span>
        </button>
      </div>
    </>
  );
};
