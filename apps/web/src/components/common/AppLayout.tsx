import React, { type ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Building2, MapPinned, CalendarCheck, FileCheck, IndianRupee, Settings2, UserCircle } from 'lucide-react';

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
  return (
    <div className="app-shell min-h-screen bg-canvas">
      {/* Top Utility Bar */}
      <header className="utility-bar bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && (
            <h1 className="text-xl font-semibold text-navy">
              {title}
            </h1>
          )}
          <GlobalSearchInput placeholder="Search properties, leads, clients..." />
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <span className="absolute top-1 right-1 bg-destructive rounded-full w-2 h-2" />
            🔔
          </button>
          <button
            aria-label="User profile"
            className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-medium text-sm">
              SK
            </span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <aside
          className="sidebar-left bg-white border-r border-neutral-200 p-4 shrink-0"
          style={{ width: '260px' }}
        >
          <div className="mb-6 px-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gold">
              Radha Real Homes CRM
            </span>
          </div>
          <SidebarNav />
        </aside>

        {/* Main Content Canvas */}
        <main className="main-content flex-1 p-8 overflow-y-auto">
          {children}
        </main>

        {/* Optional Right Rail */}
        {showRightRail && (
          <div
            className="rail-right bg-white border-l border-neutral-200 p-6 shrink-0"
            style={{ width: '320px' }}
          >
            <ContextualRail />
          </div>
        )}
      </div>
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
};

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  // WORKSPACE
  { id: 'group-workspace', label: 'WORKSPACE', group: true, icon: undefined },
  { id: 'command-center', label: 'Command Center', icon: Settings2, path: '/dashboard' },

  // CUSTOMER & SALES
  { id: 'group-customer-sales', label: 'CUSTOMER & SALES', group: true, icon: undefined },
  { id: 'leads-clients', label: 'Leads & Clients', icon: Users, path: '/leads-clients' },
  { id: 'sales-pipeline', label: 'Sales Pipeline', icon: undefined, path: '/sales-pipeline' },

  // PROPERTY
  { id: 'group-property', label: 'PROPERTY', group: true, icon: undefined },
  { id: 'property-inventory', label: 'Property Inventory', icon: Building2, path: '/properties' },
  { id: 'projects-sites', label: 'Projects & Sites', icon: MapPinned, path: '/projects' },

  // TRANSACTIONS
  { id: 'group-transactions', label: 'TRANSACTIONS', group: true, icon: FileCheck },
  { id: 'bookings', label: 'Bookings / Transactions', icon: undefined, path: '/bookings' },
  { id: 'documents', label: 'Documents', icon: undefined, path: '/documents' },

  // INTELLIGENCE
  { id: 'group-intelligence', label: 'INTELLIGENCE', group: true, icon: undefined },
  { id: 'analytics', label: 'Analytics & Goals', icon: undefined, path: '/analytics' },

  // ADMINISTRATION
  { id: 'group-administration', label: 'ADMINISTRATION', group: true, icon: undefined },
  { id: 'system-control', label: 'System Control', icon: Settings2, path: '/system-control' },
  { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
];

export { SIDEBAR_NAV_ITEMS };
export type { SidebarNavItem };

const SidebarNav: React.FC = () => {
  return (
    <nav className="space-y-1">
      {SIDEBAR_NAV_ITEMS.map((item) => {
        if (item.group) {
          return (
            <div
              key={item.id}
              className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-neutral-200"
            >
              {item.label}
            </div>
          );
        }
        return (
<NavLink
            key={item.id}
            to={item.path || '/'}
            className="w-full flex items-center gap-3 rounded-md py-2.5 px-3 text-sm font-medium transition-colors"
          >
            {item.icon ? (
              <item.icon className="w-4 h-4 shrink-0 text-gold" />
            ) : null}
            <span className="truncate">{item.label}</span>
          </NavLink>
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