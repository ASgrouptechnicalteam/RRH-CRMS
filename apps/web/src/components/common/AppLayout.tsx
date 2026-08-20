import React, { type ComponentType } from 'react';

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
              Sonthillu CRM
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
  icon: ComponentType<{ className?: string }>;
  path: string;
  active?: boolean;
};

const PlaceholderIcon: ComponentType<{ className?: string }> = () => (
  <span className="w-2 h-2 rounded-full bg-gold inline-block" />
);

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'command-center', label: 'Command Center', icon: PlaceholderIcon, path: '/dashboard' },
  { id: 'leads-clients', label: 'Leads & Clients', icon: PlaceholderIcon, path: '/leads-clients' },
  { id: 'transactions-closings', label: 'Transactions & Closings', icon: PlaceholderIcon, path: '/sales-pipeline' },
  { id: 'property-inventory', label: 'Property Inventory', icon: PlaceholderIcon, path: '/properties' },
  { id: 'projects-sites', label: 'Projects & Sites', icon: PlaceholderIcon, path: '/projects' },
  { id: 'site-visits-follow-ups', label: 'Site Visits & Follow-ups', icon: PlaceholderIcon, path: '/tasks' },
  { id: 'analytics-goals', label: 'Analytics & Goals', icon: PlaceholderIcon, path: '/analytics' },
  { id: 'finance', label: 'Finance', icon: PlaceholderIcon, path: '/finance' },
  { id: 'profile', label: 'Profile', icon: PlaceholderIcon, path: '/profile' },
];

export { SIDEBAR_NAV_ITEMS };
export type { SidebarNavItem };

const SidebarNav: React.FC = () => {
  return (
    <nav className="space-y-1">
      {SIDEBAR_NAV_ITEMS.map((item) => {
        const isActive = window.location.pathname === item.path;
        return (
          <a
            key={item.id}
            href={item.path}
            className={`
              w-full
              flex items-center gap-3
              rounded-md
              py-2.5 px-3
              text-sm font-medium
              transition-colors
              ${isActive ? 'bg-primary/10 text-navy font-semibold' : 'text-neutral-600 hover:bg-neutral-50 hover:text-navy'}
            `}
          >
            <item.icon className="w-4 h-4 shrink-0 text-gold" />
            <span className="truncate">{item.label}</span>
          </a>
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