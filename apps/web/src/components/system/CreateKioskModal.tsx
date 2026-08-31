import React, { useState, useEffect } from 'react';
import { X, Save, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';

interface CreateKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateKioskModal: React.FC<CreateKioskModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);

  const [formData, setFormData] = useState({
    branch_id: '',
    label: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      setFormData({ branch_id: '', label: '', username: '', password: '' });
    }
  }, [isOpen]);

  const fetchBranches = async () => {
    setFetchingBranches(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/employees/branches`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch (e) {
      console.error('Failed to fetch branches', e);
    } finally {
      setFetchingBranches(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        branch_id: Number(formData.branch_id),
        label: formData.label,
        username: formData.username,
        password: formData.password,
      };

      const res = await fetchWithAuth(`${API_BASE_URL}/kiosk-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create kiosk credential');
      }

      showToast('Kiosk credential created successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Create Kiosk Terminal</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="create-kiosk-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Branch <span className="text-rose-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  required
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 text-sm outline-none transition-all"
                  disabled={fetchingBranches}
                >
                  <option value="">Select a branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Terminal Label <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Main Lobby Kiosk"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. kiosk_hq_1"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-rose-500">*</span></label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 text-sm outline-none transition-all"
              />
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-kiosk-form"
            disabled={loading}
            className="px-4 py-2 text-sm font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Creating...' : 'Create Terminal'}
          </button>
        </div>
      </div>
    </div>
  );
};
