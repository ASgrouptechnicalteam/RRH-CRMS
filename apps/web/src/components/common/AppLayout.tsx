import React from 'react';
import { SidebarNav } from './SidebarNav';
import { ContextualRail } from './ContextualRail';
import { GlobalSearchInput } from './GlobalSearchInput';

/**
 * AppLayout — Global layout shell for RRH-CRMS frontend.
 *
 * Visual design direction:
 *   - Pale blue/near-white application canvas (--color-canvas: #f4fafc)
 *   - Soft blue-gray surfaces (--color-surface: #ffffff with subtle contexts)
 *   - Deep architectural navy for structure and headings (--color-navy: #203873)
 *   - Warm construction gold for brand accents (--color-gold: #e0b040)
 *   - Action blue for interactive/data states (--color-action-blue: #4268e8)
 *   - Generous spacing, 8px-based rhythm, rounded cards 14-20px
 *   - Subtle borders, very soft shadows, no gradients/no neon
 *
 * Respnsive grid:
 *   - Desktop: 12 columns
 *   - Tablet: 8 columns
 *   - Mobile: 4 columns (sidebar collapses)
 *
 * Shell structure:
 *   - Compact left sidebar (240-260px) — 100% of primary navigation
 *   - Top utility bar with ONLY global utilities (Search, Bell, Profile)
 *   - Main content canvas with responsive 12-col grid
 *   - Optional contextual right rail
 */
export const AppLayout: React.FC<{
  /** Children rendered in the main content area */
  children: React.ReactNode;
  /** Optional right rail visibility/state */
  showRightRail?: boolean;
  /** Optional title displayed in top utility bar */
  title?: string;
}> = ({ children, showRightRail = false, title }) => {
  return (
    <div className="app-shell min-h-screen">
      {/* Top Utility Bar — global utilities only (no routing links) */}
      <header className="utility-bar">
        <div className="flex items-center gap-4">
          {title && (
            <h1 className="text-xl font-semibold text-neutral-900">
              {title}
            </h1>
          )}
          {/* Global Search Input — no routing, pure search */}
          <GlobalSearchInput placeholder="Search properties, leads, clients..." />
          {/* Notifications icon */}
          <button
            aria-label="Notifications"
            className="relative p-2"
          >
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2 h-2" />
          </button>
          {/* User Profile */}
          <button
            aria-label="User profile"
            className="relative p-2"
          >
            <span className="w-6 h-6 rounded-full bg-neutral-300" />
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar | Content | (Optional) Right Rail */}
      <div className="flex min-h-screen">
        {/* Left Sidebar (compact, 240-260px) — 100% of primary navigation */}
        <aside
          className="sidebar-left"
          style={{
            '--sidebar-width': '260px',
          }}
        >
          <SidebarNav />
        </aside>

        {/* Main Content Canvas */}
        <main
          className="main-content"
          style={{
            // expands to fill available space
          }}
        >
          {children}
        </main>

        {/* Optional Contextual Right Rail */}
        {showRightRail && (
          <div
            className="rail-right"
            style={{
              '--rail-width': '320px',
            }}
          >
            <ContextualRail />
          </div>
        )}
      </div>
    </div>
  );
};

/* =============================================================================
   SidebarNav — Compact left sidebar navigation
   ============================================================================= */

type SidebarNavItem = {
  /** Unique identifier for the nav link */
  id: string;
  /** Display label (real-estate terminology) */
  label: string;
  /** Icon component (lucide-react or similar) */
  icon: React.ComponentType;
  /** Path for navigation */
  path: string;
  /** Whether this item is currently active */
  active?: boolean;
  /** Whether this item has a submenu */
  hasSubmenu?: boolean;
  /** Submenu items */
  submenu?: SidebarNavItem[];
};

/** Default sidebar navigation items for the RRH-CRMS dashboard — strictly real-estate terminology. */
const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'command-center', label: 'Command Center', icon: React.ComponentType, path: '/dashboard' },
  { id: 'leads-clients', label: 'Leads & Clients', icon: React.ComponentType, path: '/leads' },
  { id: 'transactions-closings', label: 'Transactions & Closings', icon: React.ComponentType, path: '/sales-pipeline' },
  { id: 'property-inventory', label: 'Property Inventory', icon: React.ComponentType, path: '/properties' },
  { id: 'projects-sites', label: 'Projects & Sites', icon: React.ComponentType, path: '/projects' },
  { id: 'site-visits-follow-ups', label: 'Site Visits & Follow-ups', icon: React.ComponentType, path: '/tasks' },
  { id: 'analytics-goals', label: 'Analytics & Goals', icon: React.ComponentType, path: '/analytics' },
  { id: 'finance', label: 'Finance', icon: React.ComponentType, path: '/finance' },
  { id: 'profile', label: 'Profile', icon: React.ComponentType, path: '/profile' },
];

export { SIDEBAR_NAV_ITEMS, SidebarNavItem };

/* =============================================================================
   SidebarNav component
   ============================================================================= */

const SidebarNav: React.FC = () => {
  return (
    <nav className="space-y-1">
      {SIDEBAR_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => window.location.hash || console.log(`Navigate to: ${item.path}`)}
          className`
            w-full
            flex items-center gap-3
            rounded-md
            py-2 px-3
            text-sm font-medium
            transition-colors
            data-[state=active]:bg-primary/5
            data-[state=active]:text-primary
            hover:bg-neutral-50
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-primary
          `
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

/* =============================================================================
   TopUtilityBar — Top utility bar with ONLY global utilities (Search, Bell, Profile)
   ============================================================================= */

const TopUtilityBar: React.FC = () => {
  return null; /* Rendered inline in AppLayout; title only */
};

/* =============================================================================
   ContextualRail — Optional right-rail sidebar for forms, filters, actions
   ============================================================================= */

const ContextualRail: React.FC = () => {
  return (
    <div>
      <h2 className="section-title mb-3">Filters</h2>
      <p className="section-subtitle mb-4">
        Refine your view with contextual filters.
      </p>
      {/* Placeholder for filter form */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Date range
          </label>
          <select className="input-field w-full">
            <option>This week</option>
            <option>This month</option>
            <option>This quarter</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Status
          </label>
          <select className="input-field w-full">
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
};