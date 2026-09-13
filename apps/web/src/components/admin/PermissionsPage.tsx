import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import {
  ShieldCheck,
  Save,
  RefreshCw,
  Search as SearchIcon,
  Users,
  Target,
  User,
  Building2,
  MapPin,
  Building,
  Wallet,
  ListChecks,
  Clock,
  BarChart3,
  Receipt,
  Shield,
  MoreHorizontal,
} from 'lucide-react';
import { Permissions, Roles } from '../../shared';

interface RolePermissions {
  id: number;
  name: string;
  is_system: boolean;
  permissions: string[];
}

interface PermissionGroup {
  label: string;
  prefix: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keys: string[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Employees',
    prefix: 'employees.',
    icon: Users,
    description: 'Adding, editing, and viewing staff records',
    keys: [
      'employees.create',
      'employees.read',
      'employees.update',
      'employees.delete',
      'employees.view_sensitive',
      'employees.manage_default:all',
      'employees.reset_password',
    ],
  },
  {
    label: 'Leads',
    prefix: 'leads.',
    icon: Target,
    description: 'Sales leads and how they get distributed',
    keys: [
      'leads.create',
      'leads.read',
      'leads.update',
      'leads.delete',
      'leads.assign',
      'leads.bulk_upload',
      'leads.distribution_monitor',
      'leads.whatsapp_proposal',
    ],
  },
  {
    label: 'Customers',
    prefix: 'customers.',
    icon: User,
    description: 'Converted customers and their KYC details',
    keys: [
      'customers.create',
      'customers.read',
      'customers.update',
      'customers.delete',
      'customers.convert',
      'customers.kyc_write',
    ],
  },
  {
    label: 'Properties',
    prefix: 'properties.',
    icon: Building2,
    description: 'Listings, verification, and approval steps',
    keys: [
      'properties.create',
      'properties.read',
      'properties.update',
      'properties.delete',
      'properties.verify',
      'properties.dm_polish',
      'properties.md_approve',
    ],
  },
  {
    label: 'Site Visits',
    prefix: 'site_visits.',
    icon: MapPin,
    description: 'Scheduling and verifying customer visits',
    keys: [
      'site_visits.create',
      'site_visits.read',
      'site_visits.verify',
      'site_visits.assign_agent',
      'site_visits.complete',
    ],
  },
  {
    label: 'Projects',
    prefix: 'projects.',
    icon: Building,
    description: 'Project inventory and their verification',
    keys: [
      'projects.create',
      'projects.read',
      'projects.update',
      'projects.delete',
      'projects.submit_verify',
      'projects.verify',
    ],
  },
  {
    label: 'Bookings & Payments',
    prefix: 'bookings/payments',
    icon: Wallet,
    description: 'Reservations and the money attached to them',
    keys: [
      'bookings.create',
      'bookings.read',
      'bookings.update',
      'bookings.cancel',
      'bookings.confirm',
      'payments.create',
      'payments.read',
      'payments.update',
      'payments.cancel',
    ],
  },
  {
    label: 'Tasks',
    prefix: 'tasks.',
    icon: ListChecks,
    description: 'To-dos assigned to staff',
    keys: ['tasks.create', 'tasks.read', 'tasks.update', 'tasks.assign'],
  },
  {
    label: 'Attendance',
    prefix: 'attendance.',
    icon: Clock,
    description: 'Check-ins, leave, and late requests',
    keys: [
      'attendance.read_own',
      'attendance.scan',
      'attendance.late_proposal',
      'attendance.leave_proposal',
      'attendance.proposals_queue',
      'attendance.live_monitor',
    ],
  },
  {
    label: 'Reports & Performance',
    prefix: 'reports/performance',
    icon: BarChart3,
    description: 'Targets, scorecards, and reporting',
    keys: [
      'reports.create',
      'reports.read_own',
      'reports.read_team',
      'reports.targets.configure',
      'performance.read_own',
      'performance.read_team',
      'performance.history',
    ],
  },
  {
    label: 'Expenses',
    prefix: 'expenses.',
    icon: Receipt,
    description: 'Reimbursement requests and approvals',
    keys: [
      'expenses.create',
      'expenses.read_own',
      'expenses.review',
      'expenses.md_approve',
      'expenses.mark_refunded',
    ],
  },
  {
    label: 'Admin',
    prefix: 'admin.',
    icon: Shield,
    description: 'System-level controls and security',
    keys: [
      'admin.system_metrics',
      'admin.audit_logs',
      'admin.security_alerts',
      'admin.emergency_lockdown',
    ],
  },
  {
    label: 'Other',
    prefix: 'other',
    icon: MoreHorizontal,
    description: 'Templates, documents, complaints, and AI search',
    keys: [
      'message_templates.manage',
      'documents.create',
      'documents.read',
      'documents.verify',
      'documents.delete',
      'complaints.create',
      'complaints.read',
      'complaints.update',
      'complaints.assign',
      'complaints.resolve',
      'complaints.close',
      'ai.search',
    ],
  },
];

// Renders "employees.manage_default:all" as "Employees — Manage Default All" so
// non-technical admins can read the matrix without knowing the underlying
// permission-key naming scheme. The raw key is still shown in small print
// underneath for anyone who needs the exact string (support tickets, API docs).
const ACRONYMS: Record<string, string> = {
  dm: 'DM',
  md: 'MD',
  ai: 'AI',
  kyc: 'KYC',
  crm: 'CRM',
  whatsapp: 'WhatsApp',
};
const humanizeSegment = (segment: string): string =>
  segment
    .split(/[_:]/)
    .filter(Boolean)
    .map((w) => ACRONYMS[w.toLowerCase()] || w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
const humanizePermissionKey = (key: string): string => {
  const [namespace, ...rest] = key.split('.');
  if (rest.length === 0) return humanizeSegment(namespace);
  return `${humanizeSegment(namespace)} — ${rest.map(humanizeSegment).join(' ')}`;
};

export const PermissionsPage: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { showError, showToast } = useToast();

  const [rolesPerms, setRolesPerms] = useState<RolePermissions[]>([]);
  const [allPermissionKeys, setAllPermissionKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [changedRoles, setChangedRoles] = useState<
    Record<string, { granted: string[]; denied: string[] }>
  >({});
  const [resettingRole, setResettingRole] = useState<string | null>(null);
  const [confirmResetRole, setConfirmResetRole] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/admin/permissions`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch permissions');
      }
      const data = await res.json();
      setRolesPerms(data.roles || []);
      setAllPermissionKeys(data.allPermissionKeys || Object.values(Permissions));
      // changedRoles tracks only the DIFF since this fetch (what to actually
      // PATCH), never the full current permission set — starting it with
      // [...r.permissions] made every already-granted permission look
      // "modified" the instant the page loaded, and made Save Changes PATCH
      // every role on every click regardless of what was actually edited.
      const initial: Record<string, { granted: string[]; denied: string[] }> = {};
      (data.roles || []).forEach((r: any) => {
        initial[r.name] = { granted: [], denied: [] };
      });
      setChangedRoles(initial);
    } catch (e: any) {
      showError({ message: e.message });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showError]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const currentPermsForRole = (roleName: string, permKey: string): boolean => {
    // Check if this role has the permission in DB overrides
    const role = rolesPerms.find((r) => r.name === roleName);
    if (!role) return false;
    return role.permissions.includes(permKey);
  };

  // True only when this exact (role, permission) pair is part of an unsaved
  // edit — i.e. it appears in the diff, not just whether it happens to be
  // currently enabled. (Comparing against currentPermsForRole here was the
  // bug: since changedRoles now holds a real diff, not the whole permission
  // set, any comparison against the live toggle state would mark literally
  // every enabled permission as "changed".)
  const isChanged = (roleName: string, permKey: string): boolean => {
    const changes = changedRoles[roleName];
    if (!changes) return false;
    return changes.granted.includes(permKey) || changes.denied.includes(permKey);
  };

  const handleToggle = (roleName: string, permKey: string, granted: boolean) => {
    setRolesPerms((prev) =>
      prev.map((r) => {
        if (r.name !== roleName) return r;
        const perms = [...r.permissions];
        if (granted) {
          if (!perms.includes(permKey)) perms.push(permKey);
        } else {
          const idx = perms.indexOf(permKey);
          if (idx >= 0) perms.splice(idx, 1);
        }
        return { ...r, permissions: perms };
      }),
    );

    // Track change
    setRolesPerms((prev) => {
      const updated = [...prev];
      return updated;
    });

    const current = currentPermsForRole(roleName, permKey);
    setChangedRoles((prev) => {
      const existing = prev[roleName] || { granted: [], denied: [] };
      const newGranted = [...(existing.granted || [])];
      const newDenied = [...(existing.denied || [])];

      if (granted && !current) {
        // Adding: grant it
        if (!newGranted.includes(permKey)) newGranted.push(permKey);
        const di = newDenied.indexOf(permKey);
        if (di >= 0) newDenied.splice(di, 1);
      } else if (!granted && current) {
        // Removing: deny it
        if (!newDenied.includes(permKey)) newDenied.push(permKey);
        const gi = newGranted.indexOf(permKey);
        if (gi >= 0) newGranted.splice(gi, 1);
      }

      return {
        ...prev,
        [roleName]: { granted: newGranted, denied: newDenied },
      };
    });
  };

  const saveChanges = async () => {
    const rolesToSave = Object.entries(changedRoles).filter(
      ([roleName, changes]) => changes.granted.length > 0 || changes.denied.length > 0,
    );

    if (rolesToSave.length === 0) {
      showToast('No changes to save', 'info');
      return;
    }

    setSaving(true);
    try {
      // Save each role's changes sequentially
      for (const [roleName, changes] of rolesToSave) {
        const roleData = rolesPerms.find((r) => r.name === roleName);
        if (!roleData) continue;

        const res = await fetchWithAuth(
          `${API_BASE_URL}/admin/permissions/${encodeURIComponent(roleName)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              granted: changes.granted,
              denied: changes.denied,
            }),
          },
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Failed to save changes for ${roleName}`);
        }
      }

      // Refresh
      await fetchRoles();
      showToast('Permission overrides saved successfully!', 'success');
    } catch (e: any) {
      showError({ message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const resetRole = async (roleName: string) => {
    setResettingRole(roleName);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/admin/permissions/${encodeURIComponent(roleName)}/reset`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset');
      }
      const data = await res.json();
      await fetchRoles();
      showToast(
        `Reset ${roleName} to ${data.permissionsRestored} default permission(s). Anyone in this role will need to log in again.`,
        'success',
      );
    } catch (e: any) {
      showError({ message: e.message });
    } finally {
      setResettingRole(null);
      setConfirmResetRole(null);
    }
  };

  const matchesSearch = (key: string): boolean => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return key.toLowerCase().includes(q) || humanizePermissionKey(key).toLowerCase().includes(q);
  };

  const visibleKeys = allPermissionKeys.filter((key) => {
    if (activeGroup !== 'all') {
      const group = PERMISSION_GROUPS.find((g) => g.prefix === activeGroup);
      if (!group || !group.keys.includes(key)) return false;
    }
    return matchesSearch(key);
  });

  // When showing every category at once, chunk rows under a header per
  // category (in the same order as the filter dropdown) instead of one flat
  // list of 50+ permissions — that flat list was the main thing making this
  // page hard to scan. A specific category selection stays a plain list
  // since the dropdown + description above the table already say what it is.
  const visibleKeySet = new Set(visibleKeys);
  const groupedRows =
    activeGroup === 'all'
      ? PERMISSION_GROUPS.map((g) => ({
          group: g,
          keys: g.keys.filter((k) => visibleKeySet.has(k)),
        })).filter((g) => g.keys.length > 0)
      : null;
  const activeGroupInfo =
    activeGroup !== 'all' ? PERMISSION_GROUPS.find((g) => g.prefix === activeGroup) : undefined;

  const roleNames = rolesPerms.map((r) => r.name);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-navy-700">
        <div className="w-8 h-8 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-navy-700/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-gold-500" />
            <h1 className="text-xl font-extrabold tracking-tight">Permissions Manager</h1>
          </div>
          <p className="text-xs text-navy-200/80">
            Dynamically grant or revoke permissions per role. Granting takes effect within seconds;
            denying signs out everyone currently in that role so the change is enforced right away,
            instead of waiting on their session.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSearchFilter('');
              setActiveGroup('all');
            }}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none text-sm"
          />
        </div>
        <select
          value={activeGroup}
          onChange={(e) => {
            setActiveGroup(e.target.value);
            setSearchFilter('');
          }}
          className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none text-sm"
        >
          <option value="all">All Categories</option>
          {PERMISSION_GROUPS.map((g) => (
            <option key={g.prefix} value={g.prefix}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {activeGroupInfo && (
        <p className="text-xs text-slate-500 -mt-2 flex items-center gap-1.5">
          <activeGroupInfo.icon className="w-3.5 h-3.5 text-slate-400" />
          {activeGroupInfo.description}
        </p>
      )}

      {/* Permissions Matrix Table — the wrapper itself scrolls in both axes so
          permission rows scroll vertically and role columns scroll
          horizontally within one bounded pane, instead of the whole page
          growing and losing the header/first-column context. The header row
          and the permission-name column each stay pinned via `sticky`. */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 font-bold text-slate-700 sticky left-0 top-0 z-20 bg-slate-50 min-w-[200px] border-b border-r border-slate-200">
                  Permission
                </th>
                {roleNames.map((rn) => {
                  const role = rolesPerms.find((r) => r.name === rn);
                  const grantedCount = role?.permissions.length ?? 0;
                  return (
                    <th
                      key={rn}
                      className="text-center py-3 px-2 font-bold text-slate-700 min-w-[120px] sticky top-0 z-10 bg-slate-50 border-b border-slate-200"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{rn}</span>
                        <span className="text-[10px] font-semibold text-slate-400 normal-case tracking-normal">
                          {grantedCount}/{allPermissionKeys.length} granted
                        </span>
                        <button
                          onClick={() => setConfirmResetRole(rn)}
                          disabled={resettingRole === rn}
                          title={`Reset ${rn} to default permissions`}
                          className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-navy-600 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${resettingRole === rn ? 'animate-spin' : ''}`}
                          />
                          Reset to default
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {(groupedRows ?? [{ group: undefined, keys: visibleKeys }]).map(
                ({ group, keys }, sectionIdx) => (
                  <React.Fragment key={group?.prefix ?? 'flat'}>
                    {group && (
                      <tr>
                        <td
                          colSpan={roleNames.length + 1}
                          className={`sticky left-0 py-2 px-4 text-xs font-bold text-navy-800 bg-navy-50 border-b border-slate-200 ${sectionIdx === 0 ? '' : 'border-t border-t-slate-200'}`}
                        >
                          <div className="flex items-center gap-2">
                            <group.icon className="w-3.5 h-3.5 text-navy-500" />
                            {group.label}
                            <span className="font-normal text-navy-400">— {group.description}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {keys.map((permKey) => {
                      const isModified = roleNames.some((rn) => isChanged(rn, permKey));
                      return (
                        <tr
                          key={permKey}
                          className={isModified ? 'bg-amber-50' : 'hover:bg-slate-50'}
                        >
                          <td
                            title={permKey}
                            className={`py-2 px-4 text-xs sticky left-0 z-10 border-b border-r border-slate-100 ${isModified ? 'bg-amber-50' : 'bg-white'}`}
                          >
                            <div
                              className={`font-semibold ${isModified ? 'text-amber-700' : 'text-slate-700'}`}
                            >
                              {humanizePermissionKey(permKey)}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {permKey}
                            </div>
                          </td>
                          {roleNames.map((rn) => {
                            const role = rolesPerms.find((r) => r.name === rn);
                            const hasPerm = role?.permissions.includes(permKey) || false;
                            const isRoleModified = isChanged(rn, permKey);
                            return (
                              <td
                                key={rn}
                                className="text-center py-2 px-1 border-b border-slate-100"
                              >
                                <div className="flex justify-center">
                                  <label className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={hasPerm}
                                      onChange={(e) => handleToggle(rn, permKey, e.target.checked)}
                                      className="sr-only"
                                      disabled={role?.is_system && rn === Roles.ADMIN}
                                    />
                                    <span
                                      className={`inline-block h-5 w-9 rounded-full transition-colors ${
                                        hasPerm ? 'bg-navy-600' : 'bg-slate-300'
                                      } ${isRoleModified ? 'ring-2 ring-amber-400' : ''} ${
                                        role?.is_system && rn === Roles.ADMIN
                                          ? 'opacity-50 cursor-not-allowed'
                                          : ''
                                      }`}
                                    >
                                      <span
                                        className="inline-block h-4 w-4 transform rounded-full bg-white shadow ring-1 transition-transform"
                                        style={{
                                          transform: hasPerm
                                            ? 'translateX(20px)'
                                            : 'translateX(4px)',
                                        }}
                                      />
                                    </span>
                                  </label>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ),
              )}

              {visibleKeys.length === 0 && (
                <tr>
                  <td colSpan={roleNames.length + 1} className="text-center py-8 text-slate-400">
                    No permissions match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-navy-600 rounded-full"></div>
          <span>Granted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
          <span>Denied / Default</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-400 rounded-full ring-2 ring-amber-300"></div>
          <span>Modified (not saved)</span>
        </div>
      </div>

      {/* Reset-to-default confirmation */}
      {confirmResetRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Reset "{confirmResetRole}" to default permissions?
              </h3>
            </div>
            <div className="p-6 space-y-3 text-sm text-slate-600">
              <p>
                This removes every custom permission override for this role and restores the
                standard set for it. Any unsaved edits to this role in the table above will be
                discarded.
              </p>
              <p className="font-semibold text-slate-800">
                Everyone currently in this role will be signed out and need to log in again.
              </p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setConfirmResetRole(null)}
                disabled={!!resettingRole}
                className="flex-1 bg-white text-slate-700 font-bold py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => resetRole(confirmResetRole)}
                disabled={!!resettingRole}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {resettingRole ? 'Resetting...' : 'Reset to Default'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
