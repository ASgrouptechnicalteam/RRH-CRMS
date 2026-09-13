import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  UserCog,
  CreditCard,
  FileCheck,
  FileText,
  Bell,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Briefcase,
  MapPin,
  Megaphone,
  Activity,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [{ label: 'Dashboard', path: '/md/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Management',
    items: [
      { label: 'Companies & Projects', path: '/md/projects', icon: Building2 },
      { label: 'Properties', path: '/md/properties', icon: Home },
      { label: 'Customers', path: '/md/customers', icon: Users },
      { label: 'All Employees', path: '/md/employees', icon: UserCog },
      { label: 'FM Management', path: '/md/fm', icon: MapPin },
      { label: 'DEM Management', path: '/md/dem', icon: Briefcase },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payments', path: '/md/payments', icon: CreditCard },
      { label: 'Reports & Analytics', path: '/md/reports', icon: TrendingUp },
    ],
  },
  {
    title: 'Content',
    items: [{ label: 'Content Approval', path: '/md/content-approval', icon: Megaphone }],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', path: '/md/notifications', icon: Bell },
      { label: 'Audit Logs', path: '/md/audit-logs', icon: ClipboardList },
    ],
  },
];

export const MDLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const getPageTitle = () => {
    for (const section of navSections) {
      for (const item of section.items) {
        if (location.pathname.startsWith(item.path)) return item.label;
      }
    }
    return 'Dashboard';
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 shrink-0 ${collapsed ? 'justify-center px-3' : 'px-5'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shrink-0">
            <Home className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">My Property</p>
              <p className="text-xs text-slate-400 leading-tight">Admin Console</p>
            </div>
          )}
        </div>
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.name?.charAt(0) || 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-blue-600 font-medium">Managing Director</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-2 mt-2">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all text-sm mb-0.5 ${
                    isActive
                      ? 'bg-blue-700 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <item.icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-100 p-3 shrink-0">
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute left-0 bottom-20 translate-x-full bg-white border border-slate-200 shadow-sm rounded-r-lg p-1.5 hidden md:block z-10 hover:bg-slate-50"
          style={{ left: collapsed ? '4rem' : '15rem', transition: 'left 200ms' }}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white shadow-2xl h-full z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900 text-sm">{getPageTitle()}</h2>
            <p className="text-xs text-slate-400">Managing Director Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0) || 'M'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {user?.name?.split(' ')[0]}
              </span>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded hidden sm:block">
                MD
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
