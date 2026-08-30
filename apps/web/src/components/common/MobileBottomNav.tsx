import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_NAV_ITEMS, type SidebarNavItem, SidebarNav } from './AppLayout';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const userPermissions = user?.permissions ?? [];
  const isVisible = (item: SidebarNavItem): boolean =>
    (!item.requiredPermission || userPermissions.includes(item.requiredPermission)) &&
    (!item.requiredAnyRole || item.requiredAnyRole.some((r) => user?.roles?.includes(r)));

  const handleNav = (path: string) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  // Bottom Nav items
  const homeItem = SIDEBAR_NAV_ITEMS.find(i => i.path === '/dashboard');
  const priorityPaths = ['/leads-clients', '/bookings', '/site-visits', '/tasks', '/hr-hub', '/finance', '/properties', '/projects'];
  const allNavItems = SIDEBAR_NAV_ITEMS.filter(i => !i.group && i.path);
  
  const quickLinks: SidebarNavItem[] = [];
  for (const p of priorityPaths) {
    const item = allNavItems.find(i => i.path === p);
    if (item && isVisible(item)) {
      quickLinks.push(item);
    }
    if (quickLinks.length >= 3) break;
  }

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Handle body scroll
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  return (
    <>
      {/* Dim Overlay */}
      {isDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 z-[60] backdrop-blur-sm transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`md:hidden fixed inset-y-0 right-0 w-[260px] bg-navy-950 border-l border-navy-900 z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        <div className="p-4 border-b border-navy-900 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-white text-sm">Navigation Menu</h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close navigation"
            className="p-1.5 bg-navy-900 rounded-lg border border-navy-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          <SidebarNav onItemClick={() => setIsDrawerOpen(false)} />
        </div>
      </div>

      {/* Main Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-between text-white shadow-2xl">
        {homeItem && (
          <button
            onClick={() => handleNav(homeItem.path || '/')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all ${
              location.pathname.startsWith(homeItem.path || '') ? 'text-navy-400 font-extrabold bg-navy-950/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {homeItem.icon ? <homeItem.icon className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-[9px] truncate w-full text-center">{homeItem.label}</span>
          </button>
        )}

        {quickLinks.map(item => {
          const isActive = location.pathname.startsWith(item.path || '');
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.path || '/')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all ${
                isActive ? 'text-navy-400 font-extrabold bg-navy-950/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon ? <item.icon className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              <span className="text-[9px] truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open navigation"
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
