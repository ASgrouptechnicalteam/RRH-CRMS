import React, { useState, useEffect } from 'react';
import { Key, Plus, MonitorSmartphone, Shield, Power, PowerOff, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { KioskCredentialModal } from './KioskCredentialModal';

interface Branch {
  id: number;
  name: string;
}

interface KioskCredential {
  id: number;
  branch_id: number;
  branch_name: string;
  label: string;
  username: string;
  is_active: boolean;
  credential_version: number;
}

export const KioskCredentialManagement: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  
  const [credentials, setCredentials] = useState<KioskCredential[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<KioskCredential | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [credsRes, branchesRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/kiosk-credentials`),
        fetchWithAuth(`${API_BASE_URL}/employees/branches`)
      ]);

      if (credsRes.ok && branchesRes.ok) {
        const credsData = await credsRes.json();
        const branchesData = await branchesRes.json();
        setCredentials(credsData.credentials || []);
        setBranches(branchesData.branches || []);
      } else {
        showToast('Failed to fetch kiosk credentials data', 'error');
      }
    } catch (error) {
      showToast('Network error while fetching kiosk credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCredential(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cred: KioskCredential) => {
    setEditingCredential(cred);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingCredential) {
        // Update
        const res = await fetchWithAuth(`${API_BASE_URL}/kiosk-credentials/${editingCredential.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (res.ok) {
          showToast('Kiosk credential updated successfully', 'success');
          setIsModalOpen(false);
          fetchData();
        } else {
          showToast(resData.error || 'Failed to update credential', 'error');
        }
      } else {
        // Create
        const res = await fetchWithAuth(`${API_BASE_URL}/kiosk-credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (res.ok) {
          showToast('Kiosk credential created successfully', 'success');
          setIsModalOpen(false);
          fetchData();
        } else {
          showToast(resData.error || 'Failed to create credential', 'error');
        }
      }
    } catch (error) {
      showToast('Network error during operation', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Kiosk Access Management</h3>
          <p className="text-sm text-slate-500">Manage device credentials for physical attendance kiosks</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-navy-700 text-white rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Kiosk Credential
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4">Label & Branch</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Security</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-navy-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Loading credentials...
                    </div>
                  </td>
                </tr>
              ) : credentials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <MonitorSmartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">No Kiosk Credentials</p>
                    <p className="text-xs mt-1">Create your first kiosk credential to allow physical attendance scans.</p>
                  </td>
                </tr>
              ) : (
                credentials.map(cred => (
                  <tr key={cred.id} className={`hover:bg-slate-50/50 transition-colors ${!cred.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${cred.is_active ? 'bg-navy-50 text-navy-600' : 'bg-slate-100 text-slate-400'}`}>
                          <MonitorSmartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{cred.label}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            {cred.branch_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                        {cred.username}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {cred.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          <Power className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <PowerOff className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                        v{cred.credential_version}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(cred)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KioskCredentialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingCredential}
        branches={branches}
      />
    </div>
  );
};
