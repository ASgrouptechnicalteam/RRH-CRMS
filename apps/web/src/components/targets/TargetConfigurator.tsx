import React, { useState, useEffect } from 'react';
import { Target, Sparkles, Plus, Save, Calendar, User, ShieldCheck, AlertCircle, Bookmark, Trash2, GripVertical, CheckSquare, Type, Hash, AlignLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { Roles } from '@rrh-ems/shared';
import { TargetListItem, EmployeeListItem, DailyReportPreset } from '../../types';

type FieldType = 'SHORT_TEXT' | 'LONG_TEXT' | 'COUNT' | 'CHECKLIST' | string;

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  targetValue?: number;
}

export const TargetConfigurator: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [targetsList, setTargetsList] = useState<TargetListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [presets, setPresets] = useState<Record<string, DailyReportPreset>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedRole, setSelectedRole] = useState<string>(Roles.TELECALLER);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Dynamic Google-Form Style Configurator
  const [formSchema, setFormSchema] = useState<FormField[]>([]);

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

      let loadedTargets: TargetListItem[] = [];
      let loadedPresets: Record<string, DailyReportPreset> = {};
      
      if (targetRes.ok) {
        const d = await targetRes.json();
        loadedTargets = d.targets || [];
        setTargetsList(loadedTargets);
      }
      if (presetRes.ok) {
        const d = await presetRes.json();
        loadedPresets = d.presets || {};
        setPresets(loadedPresets);
      }
      if (empRes.ok) {
        const d = await empRes.json();
        setEmployees(d.employees || []);
      }

      // Initialize the schema for the current role
      loadSchemaForRole(Roles.TELECALLER, loadedTargets, loadedPresets);

    } catch (e) {
      console.error('Failed to load configurator data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadSchemaForRole = (role: string, currentTargets: TargetListItem[] = targetsList, currentPresets: Record<string, DailyReportPreset> = presets) => {
    // 1. Try to load from active target first
    const activeTarget = currentTargets.find(t => t.role_name === role && !t.employee_id);
    if (activeTarget && activeTarget.form_schema_json && activeTarget.form_schema_json.length > 0) {
      setFormSchema(activeTarget.form_schema_json);
      return;
    }
    
    // 2. Try to load from presets
    const preset = currentPresets[role];
    if (preset && preset.form_schema_json) {
      setFormSchema(preset.form_schema_json);
      return;
    }

    // 3. Fallback
    setFormSchema([]);
  };

  // When role changes, load its default schema
  useEffect(() => {
    if (!isLoading) {
      loadSchemaForRole(selectedRole);
    }
  }, [selectedRole]);

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: 'New Question',
      required: true,
    };
    setFormSchema(prev => [...prev, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<FormField>) => {
    setFormSchema(prev => {
      const clone = [...prev];
      clone[index] = { ...clone[index], ...updates };
      return clone;
    });
  };

  const handleRemoveField = (index: number) => {
    setFormSchema(prev => prev.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === formSchema.length - 1) return;

    setFormSchema(prev => {
      const clone = [...prev];
      const swapIndex = direction === 'UP' ? index - 1 : index + 1;
      const temp = clone[index];
      clone[index] = clone[swapIndex];
      clone[swapIndex] = temp;
      return clone;
    });
  };

  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case 'SHORT_TEXT': return <Type className="w-4 h-4 text-slate-500" />;
      case 'LONG_TEXT': return <AlignLeft className="w-4 h-4 text-slate-500" />;
      case 'COUNT': return <Hash className="w-4 h-4 text-slate-500" />;
      case 'CHECKLIST': return <CheckSquare className="w-4 h-4 text-slate-500" />;
    }
  };

  const getFieldLabel = (type: FieldType) => {
    switch (type) {
      case 'SHORT_TEXT': return 'Short Answer';
      case 'LONG_TEXT': return 'Paragraph';
      case 'COUNT': return 'Number / Count';
      case 'CHECKLIST': return 'Checklist Item';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Re-map the targets_json for legacy compatibility (if form has them)
      const targets_json: Record<string, number> = {};
      formSchema.forEach(field => {
        if (field.type === 'COUNT') {
          // Find standard metric keys if they match label roughly (best effort fallback)
          if (field.label.toLowerCase().includes('call')) targets_json.callsMade = 50; 
        }
      });

      const res = await fetchWithAuth(`${API_BASE_URL}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_name: selectedRole,
          employee_id: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : null,
          target_type: 'COUNT', // Legacy, ignored for dynamic
          targets_json, // Legacy
          form_schema_json: formSchema,
          start_date: startDate,
          end_date: endDate || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Dynamic Target Configuration Saved Successfully!');
        fetchData();
        setTimeout(() => setMessage(null), 4000);
      } else {
        throw new Error(data.error || 'Failed to set target');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setMessage(`❌ ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-navy-50 rounded-xl">
              <Target className="w-6 h-6 text-navy-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Dynamic Daily Log & Target Configurator</h3>
              <p className="text-sm text-slate-500">Google-Form style builder for employee daily submissions</p>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Target Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-600 font-bold text-slate-800 shadow-sm"
              >
                {Object.values(Roles).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Specific Employee Override (Optional)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-600 font-bold text-slate-800 shadow-sm"
              >
                <option value="">Apply to ALL {selectedRole}s</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.roles.join(', ')} ({emp.branch})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC GOOGLE FORM BUILDER UI */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <h4 className="font-bold flex items-center gap-2">
                <AlignLeft className="w-5 h-5" />
                Form Schema Builder
              </h4>
              <span className="text-xs bg-slate-700 px-3 py-1 rounded-full font-mono">
                {formSchema.length} Fields Defined
              </span>
            </div>

            <div className="p-4 space-y-4">
              {formSchema.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                    <Type className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No fields defined for this role yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Add fields below to build the submission form.</p>
                </div>
              ) : (
                formSchema.map((field, index) => (
                  <div key={field.id} className="group relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-navy-300 transition-colors">
                    
                    {/* Left Drag Handle */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 rounded-l-2xl border-r border-slate-100">
                      <button type="button" onClick={() => moveField(index, 'UP')} disabled={index === 0} className="p-1 text-slate-400 hover:text-navy-600 disabled:opacity-30">
                        ▲
                      </button>
                      <button type="button" onClick={() => moveField(index, 'DOWN')} disabled={index === formSchema.length - 1} className="p-1 text-slate-400 hover:text-navy-600 disabled:opacity-30">
                        ▼
                      </button>
                    </div>

                    <div className="ml-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-8">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                          className="w-full text-lg font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-navy-600 focus:outline-none py-1 mb-2 transition-colors"
                          placeholder="Question Label"
                        />
                        
                        {/* Field Preview rendering */}
                        <div className="mt-2 flex gap-4">
                          <div className="opacity-60 pointer-events-none flex-1">
                            {field.type === 'SHORT_TEXT' && <input type="text" placeholder="Short answer text" className="w-1/2 p-2 border-b border-dashed border-slate-300 bg-transparent" disabled />}
                            {field.type === 'LONG_TEXT' && <textarea placeholder="Long answer text" className="w-full p-2 border-b border-dashed border-slate-300 bg-transparent resize-none h-10" disabled />}
                            {field.type === 'COUNT' && <div className="flex items-center gap-2"><input type="number" placeholder="0" className="w-24 p-2 border border-slate-200 rounded bg-slate-50 text-right" disabled /> <span className="text-xs">Count</span></div>}
                            {field.type === 'CHECKLIST' && <div className="flex items-center gap-2 text-sm"><input type="checkbox" disabled /> Yes / Done</div>}
                          </div>
                          {field.type === 'COUNT' && (
                            <div className="flex-none">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target to achieve</label>
                              <input 
                                type="number" 
                                min="0" 
                                placeholder="Target"
                                value={field.targetValue || 0}
                                onChange={(e) => handleUpdateField(index, { targetValue: parseInt(e.target.value, 10) || 0 })}
                                className="w-24 p-1.5 text-sm border border-slate-200 rounded bg-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-4 flex flex-col items-end gap-3 border-l border-slate-100 pl-4">
                        <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold w-full justify-between">
                          {getFieldIcon(field.type)}
                          <span className="text-slate-600 ml-2">{getFieldLabel(field.type)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full justify-end mt-2">
                          <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                            <span>Required</span>
                            <div className="relative inline-block w-10 align-middle select-none">
                              <input 
                                type="checkbox" 
                                checked={field.required} 
                                onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                style={{ right: field.required ? '0' : 'auto', borderColor: field.required ? '#4f46e5' : '#cbd5e1' }}
                              />
                              <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${field.required ? 'bg-navy-600' : 'bg-slate-300'}`}></label>
                            </div>
                          </label>
                          <div className="w-px h-6 bg-slate-200"></div>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(index)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Field"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-sm font-bold text-slate-500 mr-2">Add Field:</span>
                <button type="button" onClick={() => handleAddField('SHORT_TEXT')} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:border-navy-500 hover:text-navy-700 text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all">
                  <Type className="w-4 h-4" /> Short Text
                </button>
                <button type="button" onClick={() => handleAddField('LONG_TEXT')} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:border-navy-500 hover:text-navy-700 text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all">
                  <AlignLeft className="w-4 h-4" /> Paragraph
                </button>
                <button type="button" onClick={() => handleAddField('COUNT')} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:border-navy-500 hover:text-navy-700 text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all">
                  <Hash className="w-4 h-4" /> Number Count
                </button>
                <button type="button" onClick={() => handleAddField('CHECKLIST')} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:border-navy-500 hover:text-navy-700 text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all">
                  <CheckSquare className="w-4 h-4" /> Checklist
                </button>
              </div>
            </div>
          </div>
          {/* END BUILDER */}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Active From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expires On (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || formSchema.length === 0}
            className="w-full py-4 bg-navy-700 hover:bg-navy-800 text-white text-lg font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-6 h-6" />
            <span>Publish Dynamic Form for {selectedRole}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
