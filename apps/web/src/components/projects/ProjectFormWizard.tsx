import React, { useState, useEffect } from 'react';
import { Building2, X, MapPin, Calendar, Layout, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';

interface ProjectFormWizardProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // If provided, acts as Edit mode
}

export const ProjectFormWizard: React.FC<ProjectFormWizardProps> = ({ onClose, onSuccess, initialData }) => {
  const { fetchWithAuth, user } = useAuth();
  const { showToast } = useToast();

  const isEdit = !!initialData;
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(initialData?.name || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [totalArea, setTotalArea] = useState(initialData?.total_area || '');
  const [launchDate, setLaunchDate] = useState(
    initialData?.launch_date ? new Date(initialData.launch_date).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState(initialData?.status || 'PLANNING');
  const [assignedPmId, setAssignedPmId] = useState<string>(
    initialData?.assigned_pm_id ? initialData.assigned_pm_id.toString() : ''
  );

  const [pms, setPms] = useState<any[]>([]);

  useEffect(() => {
    // Fetch PMs if the user has appropriate roles or permissions
    // The backend /employees endpoint might require specific permissions, but we can try.
    if (user?.roles?.some(r => ['Managing director', 'Admin (Technical)', 'HR'].includes(r))) {
      fetchWithAuth(`${API_BASE_URL}/employees`)
        .then(res => res.json())
        .then(data => {
          if (data.employees) {
            setPms(data.employees.filter((e: any) => e.roles?.some((r: any) => r.includes('Project Manager'))));
          }
        })
        .catch(() => {});
    }
  }, [user, fetchWithAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) {
      showToast('Name and Location are required', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        name,
        location,
        description,
        total_area: totalArea,
        launch_date: launchDate ? new Date(launchDate).toISOString() : null,
        assigned_pm_id: assignedPmId ? parseInt(assignedPmId, 10) : null,
      };

      if (isEdit) {
        payload.status = status;
      }

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${API_BASE_URL}/projects/${initialData.id}` : `${API_BASE_URL}/projects`;

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Project ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
        onSuccess();
      } else {
        showToast(data.error || 'Failed to save project', 'error');
      }
    } catch (err) {
      showToast('Network error while saving project', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl relative overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
              <p className="text-xs text-slate-500">Manage site or venture details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all" 
                  placeholder="e.g. Sonthillu Luxury Villas Phase 1" 
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Location / City *</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all" 
                    placeholder="e.g. Miyapur, Hyderabad" 
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={3} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all" 
                  placeholder="Detailed description of the project, amenities, and highlights..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Area</label>
                <div className="relative">
                  <Layout className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    value={totalArea} 
                    onChange={e => setTotalArea(e.target.value)} 
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all" 
                    placeholder="e.g. 5 Acres" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Launch Date</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="date" 
                    value={launchDate} 
                    onChange={e => setLaunchDate(e.target.value)} 
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all" 
                  />
                </div>
              </div>

              {pms.length > 0 && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign Project Manager</label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                    <select 
                      value={assignedPmId} 
                      onChange={e => setAssignedPmId(e.target.value)} 
                      className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    >
                      <option value="">-- No PM Assigned --</option>
                      {pms.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.full_name} ({pm.employee_code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {isEdit && (
                <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Project Status</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)} 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Project')}
          </button>
        </div>
      </div>
    </div>
  );
};
