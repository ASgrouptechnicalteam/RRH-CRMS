import React, { useState, useEffect } from 'react';
import { Target, Sparkles, Plus, Save, Calendar, User, ShieldCheck, AlertCircle, Bookmark, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { Roles } from '@rrh-ems/shared';

export const TargetConfigurator: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [targetsList, setTargetsList] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [presets, setPresets] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedRole, setSelectedRole] = useState<string>(Roles.TELECALLER);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [callsMadeTarget, setCallsMadeTarget] = useState('50');
  const [leadsQualifiedTarget, setLeadsQualifiedTarget] = useState('5');
  const [siteVisitsTarget, setSiteVisitsTarget] = useState('3');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Dynamic Custom Target Metric Fields
  const [customFields, setCustomFields] = useState<Array<{ name: string; count: string }>>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCount, setNewFieldCount] = useState('1');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [targetRes, presetRes, empRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/targets/all`),
        fetchWithAuth(`${API_BASE_URL}/targets/presets`),
        fetchWithAuth(`${API_BASE_URL}/md/employees`),
      ]);

      if (targetRes.ok) {
        const d = await targetRes.json();
        setTargetsList(d.targets || []);
      }
      if (presetRes.ok) {
        const d = await presetRes.json();
        setPresets(d.presets || {});
      }
      if (empRes.ok) {
        const d = await empRes.json();
        setEmployees(d.employees || []);
      }
    } catch (e) {
      console.error('Failed to load configurator data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    setCustomFields((prev) => [...prev, { name: newFieldName.trim(), count: newFieldCount || '1' }]);
    setNewFieldName('');
    setNewFieldCount('1');
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadPresets = () => {
    const savedCustom = localStorage.getItem(`rrh_preset_${selectedRole}`);
    let preset = savedCustom ? JSON.parse(savedCustom) : presets[selectedRole];

    if (preset && preset.targets_json) {
      if (preset.targets_json.callsMade !== undefined) setCallsMadeTarget(String(preset.targets_json.callsMade));
      if (preset.targets_json.leadsQualified !== undefined) setLeadsQualifiedTarget(String(preset.targets_json.leadsQualified));
      if (preset.targets_json.siteVisits !== undefined) setSiteVisitsTarget(String(preset.targets_json.siteVisits));
      setMessage(`✨ Preset loaded for ${selectedRole}!`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveCustomPreset = () => {
    const customPreset = {
      role_name: selectedRole,
      target_type: 'COUNT',
      targets_json: {
        callsMade: parseInt(callsMadeTarget, 10) || 0,
        leadsQualified: parseInt(leadsQualifiedTarget, 10) || 0,
        siteVisits: parseInt(siteVisitsTarget, 10) || 0,
      },
    };
    localStorage.setItem(`rrh_preset_${selectedRole}`, JSON.stringify(customPreset));
    setMessage(`💾 Custom Preset saved for ${selectedRole}!`);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const targets_json: Record<string, number> = {};
      if (selectedRole === Roles.TELECALLER) {
        targets_json.callsMade = parseInt(callsMadeTarget, 10) || 0;
        targets_json.leadsQualified = parseInt(leadsQualifiedTarget, 10) || 0;
      } else if (selectedRole === Roles.PROJECT_MANAGER) {
        targets_json.siteVisits = parseInt(siteVisitsTarget, 10) || 0;
      } else {
        targets_json.callsMade = parseInt(callsMadeTarget, 10) || 0;
      }

      // Add dynamic custom fields
      customFields.forEach((cf) => {
        targets_json[cf.name] = parseInt(cf.count, 10) || 1;
      });

      const res = await fetchWithAuth(`${API_BASE_URL}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_name: selectedRole,
          employee_id: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : null,
          target_type: 'COUNT',
          targets_json,
          start_date: startDate,
          end_date: endDate || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Target Configuration Saved Successfully!');
        fetchData();
        setTimeout(() => setMessage(null), 4000);
      } else {
        throw new Error(data.error || 'Failed to set target');
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-teal-700" />
            <div>
              <h3 className="text-lg font-bold text-slate-800">Role & Employee Target Configurator</h3>
              <p className="text-xs text-slate-500">Configure daily work targets, employee overrides, and custom metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadPresets}
              type="button"
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Load Preset</span>
            </button>

            <button
              onClick={handleSaveCustomPreset}
              type="button"
              className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Bookmark className="w-4 h-4 text-teal-600" />
              <span>Save Custom Preset</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-xl border border-slate-200 font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
              >
                {Object.values(Roles).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Employee Override (Optional)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
              >
                <option value="">All Role Employees (Role Target)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.roles.join(', ')} ({emp.branch})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Standard Metric Inputs */}
          {selectedRole === Roles.TELECALLER && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-teal-50/50 rounded-xl border border-teal-100">
              <div>
                <label className="block text-[11px] font-bold text-teal-900 uppercase mb-1">Calls Made Target</label>
                <input
                  type="number"
                  min="1"
                  value={callsMadeTarget}
                  onChange={(e) => setCallsMadeTarget(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-teal-200 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-teal-900 uppercase mb-1">Leads Qualified Target</label>
                <input
                  type="number"
                  min="1"
                  value={leadsQualifiedTarget}
                  onChange={(e) => setLeadsQualifiedTarget(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-teal-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>
          )}

          {/* Dynamic Custom Target Metric Builder */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-teal-700" /> Add Custom Target Metric / Field
            </h4>

            {customFields.map((cf, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-800">{cf.name}: <span className="font-mono text-teal-700">{cf.count}</span></span>
                <button type="button" onClick={() => handleRemoveCustomField(idx)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Metric Name (e.g. Deals Closed, Property Inspections)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="flex-1 p-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
              <input
                type="number"
                min="1"
                placeholder="Count"
                value={newFieldCount}
                onChange={(e) => setNewFieldCount(e.target.value)}
                className="w-20 p-2 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleAddCustomField}
                className="px-3 py-2 bg-teal-700 text-white text-xs font-bold rounded-lg hover:bg-teal-800"
              >
                Add Field
              </button>
            </div>
          </div>

          {/* Scheduled Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date (Optional Expiration)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save & Schedule Target Configuration</span>
          </button>
        </form>
      </div>

      {/* Target Campaigns History List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h4 className="font-bold text-sm text-slate-800 mb-3">Active Target Configurations</h4>
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading targets list...</p>
        ) : targetsList.length === 0 ? (
          <p className="text-xs text-slate-400">No active targets configured yet.</p>
        ) : (
          <div className="space-y-2">
            {targetsList.map((t) => (
              <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-teal-800">{t.role_name}</span>
                  {t.employee && <span className="ml-2 font-mono text-[11px] text-slate-500">({t.employee.employee_code})</span>}
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Target: {JSON.stringify(t.targets_json)}
                  </p>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  Starts: {new Date(t.start_date).toLocaleDateString()}
                  {t.end_date && <div>Ends: {new Date(t.end_date).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
