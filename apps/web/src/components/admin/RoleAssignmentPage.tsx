import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Users, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { Roles } from '../../shared';

interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  roles: string[];
}

export const RoleAssignmentPage: React.FC = () => {
  const { fetchWithAuth, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Maintain a local state for editing roles before saving
  const [editedRoles, setEditedRoles] = useState<Record<number, string[]>>({});

  useEffect(() => {
    fetchEmployees();
  }, [fetchWithAuth]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchWithAuth(`${API_BASE_URL}/employees`);
      if (!res.ok) throw new Error('Failed to fetch employees');
      
      const data = await res.json();
      setEmployees(data.employees || []);
      
      // Initialize edited roles
      const rolesMap: Record<number, string[]> = {};
      data.employees.forEach((emp: Employee) => {
        rolesMap[emp.id] = [...emp.roles];
      });
      setEditedRoles(rolesMap);

      // Fetch available roles from the database
      const rolesRes = await fetchWithAuth(`${API_BASE_URL}/roles`);
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setAvailableRoles((rolesData.roles || []).map((r: any) => r.name));
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (employeeId: number, roleName: string) => {
    setEditedRoles(prev => {
      const current = prev[employeeId] || [];
      if (current.includes(roleName)) {
        return { ...prev, [employeeId]: current.filter(r => r !== roleName) };
      } else {
        return { ...prev, [employeeId]: [...current, roleName] };
      }
    });
  };

  const saveRoles = async (employeeId: number) => {
    const rolesToSave = editedRoles[employeeId] || [];
    if (rolesToSave.length === 0) {
      alert("An employee must have at least one role.");
      return;
    }

    try {
      setSavingId(employeeId);
      const res = await fetchWithAuth(`${API_BASE_URL}/employees/${employeeId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ role_names: rolesToSave })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update roles');
      }

      // Success - update local employees array
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, roles: [...rolesToSave] } : emp
      ));
      alert("Roles updated successfully");
    } catch (err: any) {
      alert(err.message);
      // Revert local edit state to original
      const originalEmp = employees.find(e => e.id === employeeId);
      if (originalEmp) {
        setEditedRoles(prev => ({ ...prev, [employeeId]: [...originalEmp.roles] }));
      }
    } finally {
      setSavingId(null);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const search = searchQuery.toLowerCase();
    return emp.fullName.toLowerCase().includes(search) || emp.employeeCode.toLowerCase().includes(search);
  });

  const isUserAdmin = user?.roles?.includes(Roles.ADMIN);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-navy-700/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-gold-500" />
              <h1 className="text-2xl font-extrabold tracking-tight">System Role Assignment</h1>
            </div>
            <p className="text-sm text-navy-200/80 max-w-2xl">
              Manage functional system access by assigning precise fixed roles to employees. 
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Users className="w-4 h-4" />
            <span>{filteredEmployees.length} Employees found</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 text-danger-700 rounded-xl flex items-start gap-3 border border-danger-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-navy-700">
            <div className="w-8 h-8 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <p>No employees match your search criteria.</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-1 space-y-4">
            {filteredEmployees.map((emp) => {
              const currentEditedRoles = editedRoles[emp.id] || [];
              const hasChanges = JSON.stringify([...currentEditedRoles].sort()) !== JSON.stringify([...emp.roles].sort());
              const isSaving = savingId === emp.id;

              return (
                <div key={emp.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    
                    {/* Employee Identity */}
                    <div className="flex items-center gap-4 min-w-[250px] shrink-0">
                      <div className="w-12 h-12 bg-navy-50 text-navy-700 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border border-navy-100">
                        {emp.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-navy-900 text-lg leading-tight">{emp.fullName}</h3>
                        <div className="text-sm font-semibold text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">
                          {emp.employeeCode}
                        </div>
                      </div>
                    </div>

                    {/* Roles Checkboxes */}
                    <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap gap-3">
                      {availableRoles.map(role => {
                        const isSelected = currentEditedRoles.includes(role);
                        // MDs cannot assign ADMIN role unless they are an ADMIN
                        const isDisabled = role === Roles.ADMIN && !isUserAdmin;
                        
                        return (
                          <label key={role} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-colors ${
                            isSelected ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-700 border-slate-300 hover:border-navy-500'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input 
                              type="checkbox" 
                              className="sr-only"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => handleRoleToggle(emp.id, role)}
                            />
                            <span className="text-sm font-semibold tracking-tight">{role}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Action */}
                    <div className="shrink-0 flex items-center pt-2 lg:pt-0">
                      <button
                        onClick={() => saveRoles(emp.id)}
                        disabled={!hasChanges || isSaving}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm w-full lg:w-auto ${
                          hasChanges 
                            ? 'bg-gold-500 text-navy-900 hover:bg-gold-400 border border-gold-600 shadow-gold-500/20 hover:shadow-lg' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Roles
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
