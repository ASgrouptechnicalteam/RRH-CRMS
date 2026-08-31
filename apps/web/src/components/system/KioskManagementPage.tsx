import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { ShieldCheck, Plus, MonitorSmartphone, Power, PowerOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { CreateKioskModal } from './CreateKioskModal';

interface KioskCredential {
  id: number;
  branch_id: number;
  branch_name: string;
  label: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export const KioskManagementPage: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const [kiosks, setKiosks] = useState<KioskCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchKiosks = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/kiosk-auth`);
      if (res.ok) {
        const data = await res.json();
        setKiosks(data.credentials || []);
      }
    } catch (e) {
      console.error('Failed to fetch kiosks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKiosks();
  }, []);

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/kiosk-auth/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) {
        showToast('Kiosk status updated', 'success');
        fetchKiosks();
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-navy-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MonitorSmartphone className="w-5 h-5 text-gold-500" />
            <h1 className="text-xl font-extrabold tracking-tight">Kiosk Management</h1>
          </div>
          <p className="text-xs text-navy-200/80">
            Manage physical attendance kiosk terminals and credentials.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Terminal
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading kiosks...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Label</th>
                  <th className="p-4 font-semibold">Username</th>
                  <th className="p-4 font-semibold">Branch</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kiosks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No kiosk credentials found. Add a terminal to get started.
                    </td>
                  </tr>
                ) : (
                  kiosks.map((kiosk) => (
                    <tr key={kiosk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{kiosk.label}</td>
                      <td className="p-4 font-mono text-xs text-slate-600">{kiosk.username}</td>
                      <td className="p-4 text-slate-600">{kiosk.branch_name}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          kiosk.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {kiosk.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleActive(kiosk.id, kiosk.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            kiosk.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={kiosk.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {kiosk.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateKioskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchKiosks()}
      />
    </div>
  );
};
