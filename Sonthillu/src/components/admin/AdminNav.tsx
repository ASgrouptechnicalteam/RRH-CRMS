import Link from 'next/link';
import React from 'react';

const NAV_ITEMS = [
  { href: '/admin/overview', label: 'Overview', icon: '📊', perm: 'any' },
  { href: '/admin/leads', label: 'Leads', icon: '📋', perm: 'analytics:read' },
  { href: '/admin/searches', label: 'Searches', icon: '🔍', perm: 'analytics:read' },
  { href: '/admin/ai-search', label: 'AI Search', icon: '✨', perm: 'analytics:read' },
  { href: '/admin/properties', label: 'Properties', icon: '🏠', perm: 'analytics:read' },
  { href: '/admin/recommendations', label: 'Recommendations', icon: '⭐', perm: 'analytics:read' },
  { href: '/admin/customers', label: 'Customers', icon: '👥', perm: 'analytics:read' },
  { href: '/admin/content/hero', label: 'Hero CMS', icon: '🖼️', perm: 'content:write' },
  { href: '/admin/system', label: 'System', icon: '⚙️', perm: 'system:read' },
];

interface AdminNavProps {
  role: string;
  adminName: string;
  currentPath: string;
}

function hasPermission(role: string, perm: string): boolean {
  if (perm === 'any') return true;
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    SUPER_ADMIN: ['admin:manage', 'analytics:read', 'content:write', 'audit:read', 'system:read'],
    ADMIN: ['analytics:read', 'content:write', 'audit:read'],
    ANALYST: ['analytics:read'],
    CONTENT_MANAGER: ['content:write'],
  };
  return (ROLE_PERMISSIONS[role] ?? []).includes(perm);
}

export function AdminNav({ role, adminName, currentPath }: AdminNavProps) {
  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(role, item.perm));

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-brand-navy min-h-screen">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/10">
        <p className="text-xs uppercase tracking-widest text-white/50 font-semibold">Sonthillu</p>
        <p className="text-white font-bold text-sm mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const active = currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-white/50 truncate">{adminName}</p>
        <p className="text-xs text-white/30">{role}</p>
        <form method="POST" action="/admin/logout" className="mt-2">
          <button
            type="submit"
            className="text-xs text-white/60 hover:text-white underline transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
