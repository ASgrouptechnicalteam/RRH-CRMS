import React, { type ComponentType, useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, Building2, MapPinned, CalendarCheck, FileCheck, IndianRupee, Settings2, UserCircle, ClipboardList, Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
import { Roles, Permissions } from '@rrh-ems/shared';
import { useAuth } from '../../context/AuthContext';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { ProductTour } from '../onboarding/ProductTour';

const GlobalSearchInput: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <input
    type="search"
    placeholder={placeholder}
    aria-label="Global search"
    className="input-field"
  />
);

export const AppLayout: React.FC<{
  children: React.ReactNode;
  showRightRail?: boolean;
  title?: string;
}> = ({ children, showRightRail = false, title }) => {
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string, empCode?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (empCode) return empCode.slice(0, 2).toUpperCase();
    return 'U';
  };

  const initials = getInitials(user?.fullName, user?.employeeCode);
  const roleLabel = user?.roles?.[0] || 'Employee';

  return (
    <div className="app-shell h-[100dvh] w-full flex flex-col overflow-hidden bg-canvas">
      {/* Top Utility Bar */}
      <header className="utility-bar shrink-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="RRH-CRMS Logo" className="h-8 w-auto hidden sm:block" />
          <span className="text-sm font-black tracking-tight text-gold whitespace-nowrap sm:hidden md:inline-block">RRH-CRMS</span>
          {title && (
            <>
              <span className="text-neutral-300 hidden sm:inline-block" aria-hidden="true">/</span>
              <h1 className="text-lg font-semibold text-navy truncate max-w-[150px] sm:max-w-xs">
                {title}
              </h1>
            </>
          )}
          <div className="hidden lg:block ml-4">
            <GlobalSearchInput placeholder="Search properties, leads, clients..." />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationDrawer />
          <div className="relative" ref={profileMenuRef}>
            <button
              aria-label="Open user menu"
              aria-expanded={isProfileMenuOpen}
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <span className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-medium text-sm shadow-sm">
                {initials}
              </span>
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-neutral-100">
                  <p className="text-sm font-semibold text-navy truncate">{user?.fullName || 'Unknown User'}</p>
                  <p className="text-xs text-neutral-500 capitalize truncate">{roleLabel}</p>
                  <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{user?.employeeCode}</p>
                </div>
                <div className="py-1">
                  <NavLink to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    Profile
                  </NavLink>
                  <NavLink to="/settings" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    Settings
                  </NavLink>
                  <button onClick={() => { setIsProfileMenuOpen(false); window.dispatchEvent(new Event('restart-product-tour')); }} className="w-full text-left px-4 py-2 text-sm text-navy-600 hover:bg-navy-50">
                    Take Product Tour
                  </button>
                  <button onClick={() => { setIsProfileMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-red-50">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className="sidebar-left bg-navy-950 border-r border-navy-900 p-4 shrink-0 h-full overflow-y-auto"
          style={{ width: '260px' }}
        >
          <SidebarNav />
        </aside>

        {/* Main Content Canvas */}
        <main className="main-content flex-1 min-w-0 h-full overflow-y-auto p-8 relative">
          {children}
        </main>

        {/* Optional Right Rail */}
        {showRightRail && (
          <div
            className="rail-right bg-white border-l border-neutral-200 p-6 shrink-0 h-full overflow-y-auto"
            style={{ width: '320px' }}
          >
            <ContextualRail />
          </div>
        )}
      </div>
      <ProductTour />
    </div>
  );
};

type SidebarNavItem = {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  path?: string;
  active?: boolean;
  group?: boolean;
  /** Canonical permission value required to see this item (e.g. Permissions.LEADS_READ). Omit = always visible. */
  requiredPermission?: string;
  /** Canonical Roles.* values; item visible if the user holds ANY of them. Omit = no role restriction. */
  requiredAnyRole?: string[];
};

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  // HOME
  { id: 'group-workspace', label: 'HOME', group: true, icon: undefined },
  { id: 'command-center', label: 'Dashboard', icon: Settings2, path: '/dashboard' },

  // SALES
  { id: 'group-customer-sales', label: 'SALES', group: true, icon: undefined },
  { id: 'leads-clients', label: 'Leads', icon: Users, path: '/leads-clients' },
  { id: 'customers', label: 'Customers', path: '/customers' },
  { id: 'site-visits', label: 'Site Visits', icon: CalendarCheck, path: '/site-visits' },
  { id: 'sales-pipeline', label: 'Sales Pipeline', icon: undefined, path: '/sales-pipeline' },

  // PROPERTY
  { id: 'group-property', label: 'PROPERTY', group: true, icon: undefined },
  { id: 'property-inventory', label: 'Properties', icon: Building2, path: '/properties' },
  { id: 'projects-sites', label: 'Projects', icon: MapPinned, path: '/projects' },

  // BOOKINGS
  { id: 'group-transactions', label: 'BOOKINGS', group: true, icon: FileCheck },
  { id: 'bookings', label: 'Bookings', icon: undefined, path: '/bookings' },

  // WORK
  { id: 'group-work', label: 'WORK', group: true, icon: undefined },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/tasks' },

  // FINANCE
  { id: 'group-finance', label: 'FINANCE', group: true, icon: undefined },
  { id: 'finance', label: 'Payments & Refunds', icon: IndianRupee, path: '/finance', requiredAnyRole: [Roles.MD, Roles.ADMIN, Roles.FINANCE] },

  // HR
  { id: 'group-hr', label: 'HR', group: true, icon: undefined },
  { id: 'hr-hub', label: 'Employees & Attendance', icon: Briefcase, path: '/hr-hub', requiredAnyRole: [Roles.MD, Roles.HR_MANAGER, Roles.ADMIN] },

  // INSIGHTS
  { id: 'group-intelligence', label: 'INSIGHTS', group: true, icon: undefined },
  { id: 'analytics', label: 'Analytics & Goals', icon: undefined, path: '/analytics', requiredAnyRole: [Roles.MD, Roles.ADMIN, Roles.MARKETING_DIRECTOR, Roles.HR_MANAGER, Roles.PROJECT_MANAGER, Roles.DIGITAL_MARKETING_HEAD, Roles.FINANCE, Roles.SALES_MANAGER] },

  // ADMINISTRATION
  { id: 'group-administration', label: 'ADMINISTRATION', group: true, icon: undefined },
  { id: 'system-control', label: 'System Control', icon: Settings2, path: '/system-control', requiredPermission: Permissions.ADMIN_SYSTEM_METRICS },
  { id: 'settings', label: 'Settings', icon: Settings2, path: '/settings' },
  { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
];

export { SIDEBAR_NAV_ITEMS };
export type { SidebarNavItem };

const SidebarNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const userPermissions = user?.permissions ?? [];
  const isVisible = (item: SidebarNavItem): boolean =>
    (!item.requiredPermission || userPermissions.includes(item.requiredPermission)) &&
    (!item.requiredAnyRole || item.requiredAnyRole.some((r) => user?.roles?.includes(r)));

  type NavGroup = { groupItem: SidebarNavItem; children: SidebarNavItem[] };
  const groups: NavGroup[] = [];
  let currentGroup: NavGroup | null = null;
  
  for (const entry of SIDEBAR_NAV_ITEMS) {
    if (entry.group) {
      if (currentGroup && currentGroup.children.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = { groupItem: entry, children: [] };
    } else if (isVisible(entry)) {
      if (currentGroup) {
        currentGroup.children.push(entry);
      }
    }
  }
  if (currentGroup && currentGroup.children.length > 0) {
    groups.push(currentGroup);
  }

  const storageKey = `rrh_sidebar_state_${user?.id || 'default'}`;
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

  return (
    <nav className="space-y-4 pb-12" aria-label="Main navigation">
      {groups.map((group) => {
        const isExpanded = expandedGroups[group.groupItem.id];
        return (
          <div key={group.groupItem.id} className="space-y-1">
            <button
              onClick={() => toggleGroup(group.groupItem.id)}
              aria-expanded={isExpanded}
              aria-controls={`group-${group.groupItem.id}`}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors rounded-md hover:bg-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:bg-navy-900"
            >
              <span>{group.groupItem.label}</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 shrink-0" aria-label="Collapse group" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" aria-label="Expand group" />
              )}
            </button>
            {isExpanded && (
              <div id={`group-${group.groupItem.id}`} className="space-y-1 mt-1">
                {group.children.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path || '/'}
                    data-tour={`sidebar-${item.id}`}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                        isActive ? 'bg-navy-900 text-gold-400 font-semibold shadow-sm' : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                      }`
                    }
                  >
                    {item.icon ? (
                      <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const ContextualRail: React.FC = () => {
  return (
    <div>
      <h2 className="text-base font-semibold text-navy mb-3">Filters</h2>
      <p className="text-xs text-neutral-500 mb-4">
        Refine your view with contextual filters.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Date range
          </label>
          <select className="input-field w-full text-sm">
            <option>This week</option>
            <option>This month</option>
            <option>This quarter</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Status
          </label>
          <select className="input-field w-full text-sm">
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
};