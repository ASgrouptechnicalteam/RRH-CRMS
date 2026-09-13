import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, LayoutDashboard, LogOut, PenTool, FileText } from 'lucide-react';

const FMLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/fm/dashboard', icon: LayoutDashboard },
    { label: 'Property Updates', path: '/fm/property-updates', icon: PenTool },
    { label: 'Payment Verifications', path: '/fm/payments', icon: FileText },
    { label: 'Project Info', path: '/fm/project-info', icon: Building2 },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white">
            MP
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">My Property</span>
        </div>

        <div className="p-4 border-b border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
            FM Portal
          </p>
          <p className="font-medium text-slate-200 truncate">{user?.name || 'Field Manager'}</p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-600/10 text-emerald-400 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#0a0f1c]">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default FMLayout;
