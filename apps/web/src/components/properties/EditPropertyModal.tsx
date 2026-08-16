import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';

interface EditPropertyModalProps {
  property: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({ property, onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(property.title || '');
  const [price, setPrice] = useState(property.price?.toString() || '');
  const [description, setDescription] = useState(property.description || '');
  const [projectId, setProjectId] = useState<string>(property.project?.id?.toString() || '');
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/projects`)
      .then(res => res.json())
      .then(data => {
        if (data.projects) setProjects(data.projects);
      })
      .catch(() => {});
  }, [fetchWithAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      showToast('Title and Price are required', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title,
        description,
        price: parseFloat(price),
        project_id: projectId ? parseInt(projectId, 10) : null,
      };

      // Ensure NO workflow/status fields are sent
      const res = await fetchWithAuth(`${API_BASE_URL}/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Property updated successfully!`, 'success');
        onSuccess();
      } else {
        showToast(data.error || 'Failed to update property', 'error');
      }
    } catch (err) {
      showToast('Network error while updating property', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl relative overflow-hidden animate-scaleUp flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Property Details</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">{property.property_code}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Property Title *</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹) *</label>
              <div className="relative">
                <Coins className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500" 
              ></textarea>
            </div>

            {projects.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Associated Project / Site</label>
                <div className="relative">
                  <Building2 className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <select 
                    value={projectId} 
                    onChange={e => setProjectId(e.target.value)} 
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">-- Standalone Property (No Project) --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
};
