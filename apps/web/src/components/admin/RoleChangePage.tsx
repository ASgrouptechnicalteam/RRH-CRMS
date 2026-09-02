import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Users, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { Roles } from '../../shared';

interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  roles: string[];
}

export const RoleChangePage: React.FC = () => {
  const { fetchWithAuth, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchWithAuth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch employees
      const res = await fetchWithAuth(`${API_BASE_URL}/employees`);
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
    if (!selectedEmployeeId || !selectedRole) {
      setError('Please select both an employee and a role.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccessMsg('');

      const res = await fetchWithAuth(`${API_BASE_URL}/employees/${selectedEmployeeId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ role_names: [selectedRole] }) // Send as single item array
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to change role');
      }

      setSuccessMsg('Role successfully updated!');
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === Number(selectedEmployeeId) ? { ...emp, roles: [selectedRole] } : emp
      ));

      // Clear selection after a delay
      setTimeout(() => {
        setSuccessMsg('');
        setSelectedEmployeeId('');
        setSelectedRole('');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === Number(selectedEmployeeId));
  const isUserAdmin = user?.roles?.includes(Roles.ADMIN);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-navy-700/30">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-gold-500" />
          <h1 className="text-2xl font-extrabold tracking-tight">Dedicated Role Change</h1>
        </div>
        <p className="text-sm text-navy-200/80 max-w-2xl">
          Change an employee's primary role. This tool overwrites existing roles with the single new role selected.
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
                  setSelectedEmployeeId(Number(e.target.value));
                  const emp = employees.find(emp => emp.id === Number(e.target.value));
                  if (emp && emp.roles.length > 0) {
                    setSelectedRole(emp.roles[0]); // Default to their first existing role
                  } else {
                    setSelectedRole('');
                  }
                }}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none transition-all"
              >
                <option value="">-- Choose an Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode}) - Current: {emp.roles.join(', ') || 'None'}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection */}
            {selectedEmployeeId && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-bold text-slate-700 mb-2">New Role for {selectedEmployee?.fullName}</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableRoles.map(role => {
                    const isDisabled = role === Roles.ADMIN && !isUserAdmin;
                    const isSelected = selectedRole === role;
                    
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        disabled={isDisabled}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected 
                            ? 'bg-navy-900 border-navy-900 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-navy-300'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="font-semibold text-sm">{role}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-gold-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveRole}
                disabled={!selectedEmployeeId || !selectedRole || isSaving}
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
