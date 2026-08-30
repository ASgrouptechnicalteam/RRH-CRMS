import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_NAV_ITEMS, type SidebarNavItem } from './AppLayout';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const userPermissions = user?.permissions ?? [];
  const isVisible = (item: SidebarNavItem): boolean =>
    (!item.requiredPermission || userPermissions.includes(item.requiredPermission)) &&
    (!item.requiredAnyRole || item.requiredAnyRole.some((r) => user?.roles?.includes(r)));

  // Drawer grouping logic
  type NavGroup = { groupItem: SidebarNavItem; children: SidebarNavItem[] };
  const groups: NavGroup[] = [];
  let currentGroup: NavGroup | null = null;
  
  for (const entry of SIDEBAR_NAV_ITEMS) {
    if (entry.group) {
      if (currentGroup && currentGroup.children.length > 0) groups.push(currentGroup);
      currentGroup = { groupItem: entry, children: [] };
    } else if (isVisible(entry)) {
      if (currentGroup) currentGroup.children.push(entry);
    }
  }
  if (currentGroup && currentGroup.children.length > 0) groups.push(currentGroup);

  const storageKey = `rrh_mobile_nav_state_${user?.id || 'default'}`;
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    let shouldUpdate = false;
    const newExpanded = { ...expandedGroups };
    for (const g of groups) {
      if (g.children.some(child => child.path && location.pathname.startsWith(child.path))) {
        if (!newExpanded[g.groupItem.id]) {
          newExpanded[g.groupItem.id] = true;
          shouldUpdate = true;
        }
      }
    }
    if (shouldUpdate) {
      setExpandedGroups(newExpanded);
      const persistenceOff = localStorage.getItem(`rrh_sidebar_persist_off_${user?.id || 'default'}`) === 'true';
      if (!persistenceOff) {
        localStorage.setItem(storageKey, JSON.stringify(newExpanded));
      }
    }
  }, [location.pathname, groups, storageKey, user?.id]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = { ...expandedGroups, [groupId]: !expandedGroups[groupId] };
    setExpandedGroups(newExpanded);
    const persistenceOff = localStorage.getItem(`rrh_sidebar_persist_off_${user?.id || 'default'}`) === 'true';
    if (!persistenceOff) {
      localStorage.setItem(storageKey, JSON.stringify(newExpanded));
    }
  };

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

  // Handle escape key and custom open event
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    const handleOpenDrawer = () => setIsDrawerOpen(true);
    
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('open-mobile-drawer', handleOpenDrawer);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('open-mobile-drawer', handleOpenDrawer);
    };
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
        className={`md:hidden fixed inset-y-0 right-0 w-72 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h2 className="font-bold text-slate-800 text-sm">Navigation Menu</h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close navigation"
            className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 pb-24">
          {groups.map((group) => {
            const isExpanded = expandedGroups[group.groupItem.id];
            return (
              <div key={group.groupItem.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.groupItem.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy focus:bg-slate-50"
                >
                  <span>{group.groupItem.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 shrink-0" aria-label="Collapse group" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0" aria-label="Expand group" />
                  )}
                </button>
                {isExpanded && (
                  <div className="space-y-1 mt-1">
                    {group.children.map((item) => {
                      const isActive = location.pathname.startsWith(item.path || '');
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNav(item.path || '/')}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                            isActive ? 'bg-navy-50 text-navy-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          {item.icon ? (
                            <item.icon className="w-4 h-4 shrink-0 text-gold" />
                          ) : null}
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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

      </div>
    </>
  );
};
