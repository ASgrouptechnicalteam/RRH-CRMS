import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Users,
  AlertCircle,
  Save,
  CheckCircle2,
  Plus,
  X,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { Roles, Permissions } from '../../shared';

interface PermissionOverride {
  permission: string;
  is_granted: boolean;
}

interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  roles: string[];
}

export const RoleChangePage: React.FC = () => {
  const { fetchWithAuth, user } = useAuth();
  const { showToast, showError } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]); // Multi-role selection
  const [isSaving, setIsSaving] = useState(false);

  // Individual permission overrides (#11) — grant/revoke one permission for
  // just this employee, independent of their role assignment above.
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [newOverridePermission, setNewOverridePermission] = useState('');
  const [newOverrideGranted, setNewOverrideGranted] = useState<'grant' | 'revoke'>('grant');
  const [overrideSaving, setOverrideSaving] = useState(false);

  const fetchOverrides = useCallback(
    async (employeeId: number) => {
      setOverridesLoading(true);
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL}/employees/${employeeId}/permission-overrides`,
        );
        if (!res.ok) throw new Error('Failed to fetch permission overrides');
        const data = await res.json();
        setOverrides(data.overrides || []);
      } catch (e: any) {
        showError({ message: e.message });
      } finally {
        setOverridesLoading(false);
      }
    },
    [fetchWithAuth, showError],
  );

  useEffect(() => {
    fetchData();
  }, [fetchWithAuth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch employees — explicit high limit; the backend defaults to 20
      // with no pagination UI here, which silently hid every employee past
      // the 20th from this role-assignment dropdown (see EmployeeManagement.tsx's
      // identical fix, found via the Phase 10 manual QA pass).
      const res = await fetchWithAuth(`${API_BASE_URL}/employees?limit=1000`);
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data.employees || []);

      // Fetch roles from DB (fallback to enum if fails to prevent blank page)
      try {
        const rolesRes = await fetchWithAuth(`${API_BASE_URL}/roles`);
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setAvailableRoles((rolesData.roles || []).map((r: any) => r.name));
        } else {
          setAvailableRoles(Object.values(Roles));
        }
      } catch (e) {
        console.error('Failed to fetch roles from DB, using fallback', e);
        setAvailableRoles(Object.values(Roles));
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedEmployeeId || selectedRoles.length === 0) {
      setError('Please select both an employee and at least one role.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccessMsg('');

      const res = await fetchWithAuth(`${API_BASE_URL}/employees/${selectedEmployeeId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_names: selectedRoles }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to change role');
      }

      setSuccessMsg(`Roles successfully updated to: ${selectedRoles.join(', ')}`);

      // Update local state
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === Number(selectedEmployeeId) ? { ...emp, roles: selectedRoles } : emp,
        ),
      );

      // Clear selection after a delay
      setTimeout(() => {
        setSuccessMsg('');
        setSelectedEmployeeId('');
        setSelectedRoles([]);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addOverride = async () => {
    if (!selectedEmployeeId || !newOverridePermission) return;
    setOverrideSaving(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/employees/${selectedEmployeeId}/permission-overrides`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permission: newOverridePermission,
            is_granted: newOverrideGranted === 'grant',
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save override');
      }
      showToast(
        newOverrideGranted === 'grant'
          ? `Granted "${newOverridePermission}" to this employee.`
          : `Revoked "${newOverridePermission}" from this employee. They will need to log in again.`,
        'success',
      );
      setNewOverridePermission('');
      await fetchOverrides(Number(selectedEmployeeId));
    } catch (e: any) {
      showError({ message: e.message });
    } finally {
      setOverrideSaving(false);
    }
  };

  const clearOverride = async (permission: string) => {
    if (!selectedEmployeeId) return;
    setOverrideSaving(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/employees/${selectedEmployeeId}/permission-overrides/${encodeURIComponent(permission)}`,
        {
          method: 'DELETE',
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to clear override');
      }
      showToast(
        `Cleared the individual override for "${permission}". They will need to log in again.`,
        'success',
      );
      await fetchOverrides(Number(selectedEmployeeId));
    } catch (e: any) {
      showError({ message: e.message });
    } finally {
      setOverrideSaving(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === Number(selectedEmployeeId));
  const isUserAdmin = user?.roles?.includes(Roles.ADMIN);
  const overridablePermissionKeys = Object.values(Permissions).filter(
    (key) => !overrides.some((o) => o.permission === key),
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-navy-700/30">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-gold-500" />
          <h1 className="text-2xl font-extrabold tracking-tight">Role Change</h1>
        </div>
        <p className="text-sm text-navy-200/80 max-w-2xl">
          Change an employee's roles. Select all applicable roles — this overwrites the employee's
          existing role set.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        {error && (
          <div className="p-4 bg-danger-50 text-danger-700 rounded-xl flex items-start gap-3 border border-danger-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-success/10 text-success rounded-xl flex items-start gap-3 border border-success/20">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-bold">{successMsg}</div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-navy-700">
            <div className="w-8 h-8 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Employee</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  const empId = Number(e.target.value);
                  setSelectedEmployeeId(empId);
                  const emp = employees.find((emp) => emp.id === empId);
                  if (emp && emp.roles.length > 0) {
                    setSelectedRoles(emp.roles);
                  } else {
                    setSelectedRoles([]);
                  }
                  setOverrides([]);
                  setNewOverridePermission('');
                  if (empId) fetchOverrides(empId);
                }}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none transition-all"
              >
                <option value="">-- Choose an Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode}) - Current: {emp.roles.join(', ') || 'None'}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection — Multi-Select Checkbox Grid */}
            {selectedEmployeeId && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Roles for {selectedEmployee?.fullName}
                </label>
                <p className="text-[11px] text-slate-400 mb-3">
                  Select all roles that apply. Changes overwrite the employee's existing role set.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableRoles.map((role) => {
                    const isDisabled = role === Roles.ADMIN && !isUserAdmin;
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-navy-900 border-navy-900 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-navy-300'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles([...selectedRoles, role]);
                            } else {
                              setSelectedRoles(selectedRoles.filter((r) => r !== role));
                            }
                          }}
                          className="w-4 h-4 text-navy-600 focus:ring-navy-500 rounded"
                        />
                        <span className="font-semibold text-sm">{role}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-gold-400 ml-auto" />}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual Permission Overrides (#11) */}
            {selectedEmployeeId && (
              <div className="animate-fadeIn pt-6 border-t border-slate-100">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <UserCog className="w-4 h-4 text-navy-600" />
                  Individual Permissions for {selectedEmployee?.fullName}
                </label>
                <p className="text-[11px] text-slate-400 mb-3">
                  Give this one person an extra permission, or take one away — without changing
                  their role. A revoke signs them out immediately so it applies right away.
                </p>

                {overridesLoading ? (
                  <div className="py-6 text-center text-sm text-slate-400">
                    Loading overrides...
                  </div>
                ) : (
                  <>
                    {overrides.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {overrides.map((o) => (
                          <div
                            key={o.permission}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${
                              o.is_granted
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                  o.is_granted
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                {o.is_granted ? 'Granted' : 'Revoked'}
                              </span>
                              <span className="font-mono text-xs text-slate-700">
                                {o.permission}
                              </span>
                            </div>
                            <button
                              onClick={() => clearOverride(o.permission)}
                              disabled={overrideSaving}
                              title="Clear this override (revert to role default)"
                              className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={newOverridePermission}
                        onChange={(e) => setNewOverridePermission(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none text-sm"
                      >
                        <option value="">-- Choose a permission --</option>
                        {overridablePermissionKeys.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newOverrideGranted}
                        onChange={(e) =>
                          setNewOverrideGranted(e.target.value as 'grant' | 'revoke')
                        }
                        className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none text-sm"
                      >
                        <option value="grant">Grant</option>
                        <option value="revoke">Revoke</option>
                      </select>
                      <button
                        onClick={addOverride}
                        disabled={!newOverridePermission || overrideSaving}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-navy-700 text-white rounded-xl font-bold text-xs hover:bg-navy-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Override
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveRole}
                disabled={!selectedEmployeeId || selectedRoles.length === 0 || isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-navy-700 text-white rounded-xl font-bold text-sm hover:bg-navy-800 transition-colors shadow-sm disabled:opacity-50 min-w-[150px]"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Confirm Role Change
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
