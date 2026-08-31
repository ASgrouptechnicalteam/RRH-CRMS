import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Map } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';
import { handleApiError, toUserFacingError } from '../../utils/userFacingError';

interface Assignment {
  id: number;
  pm_id: number;
  location: string;
  level: string;
  pm: {
    id: number;
    full_name: string;
    email: string;
  };
}

interface PM {
  id: number;
  full_name: string;
  roles: string[];
}

export const PMTerritories: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { showToast , showError } = useToast();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pms, setPms] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPmId, setSelectedPmId] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, empRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/pm-routing`),
        fetchWithAuth(`${API_BASE_URL}/md/employees`)
      ]);

      if (assignRes.ok) {
        setAssignments(await assignRes.json());
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        const pmList = (empData.employees || []).filter((e: any) => 
          e.roles && e.roles.includes('project managers')
        );
        setPms(pmList);
      }
    } catch (e) {
      showError(toUserFacingError({ message: e instanceof Error ? e.message : String(e), body: e })); } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPmId || !newLocation.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/pm-routing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pm_id: parseInt(selectedPmId),
          location: newLocation.trim(),
          level: 'CITY'
        })
      });

      if (res.ok) {
        showToast('Territory assigned successfully', 'success');
        setNewLocation('');
        fetchData(); // Refresh list
      } else {
        const err = await res.json();
        showError({ message: err.message || 'Failed to assign territory' });
      }
    } catch (e) {
      showError(toUserFacingError({ message: e instanceof Error ? e.message : String(e), body: e })); } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this territory?')) return;
    
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/pm-routing/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Territory removed', 'success');
        setAssignments(prev => prev.filter(a => a.id !== id));
      } else {
        showError({ message: 'Failed to remove territory' });
      }
    } catch (e) {
      showError(toUserFacingError({ message: e instanceof Error ? e.message : String(e), body: e })); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center gap-4">
        <Map className="w-8 h-8 text-gold-500" />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">PM Territories</h1>
          <p className="text-sm text-navy-200/80">Manage geographic routing for Project Managers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-navy-600" />
              Assign Territory
            </h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Manager</label>
                <select 
                  value={selectedPmId}
                  onChange={(e) => setSelectedPmId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600/20 text-sm"
                  required
                >
                  <option value="">Select a PM...</option>
                  {pms.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">City / Location Name</label>
                <input 
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g., Hyderabad"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600/20 text-sm"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !selectedPmId || !newLocation.trim()}
                className="w-full bg-navy-900 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-navy-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Assigning...' : 'Assign Location'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Current Territories</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading territories...</div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <MapPin className="w-10 h-10 text-slate-300 mb-2" />
                <p>No territories assigned yet.</p>
                <p className="text-sm mt-1">Properties will fall into the unassigned queue.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignments.map(a => (
                  <div key={a.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-600 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{a.location}</div>
                        <div className="text-sm text-slate-500">PM: {a.pm.full_name}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemove(a.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Assignment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
