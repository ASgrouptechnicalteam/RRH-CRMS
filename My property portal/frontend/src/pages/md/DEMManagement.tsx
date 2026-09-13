import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  Users,
  UserCheck,
  UserX,
  KeyRound,
  AlertCircle,
  Loader2,
  RefreshCw,
  Activity,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  role: { name: string };
  createdAt?: string;
}

export const DEMManagement = () => {
  const [dems, setDems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [toast, setToast] = useState('');

  // Reset Password Modal
  const [resetModal, setResetModal] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/md/employees');
      const allEmployees: Employee[] = res.data;
      setDems(allEmployees.filter((e: Employee) => e.role?.name === 'DEM'));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load DEM data.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleToggleStatus = (emp: Employee) => {
    const action = emp.status === 'Active' ? 'Deactivate' : 'Activate';
    setConfirmDialog({
      open: true,
      title: `${action} ${emp.name}`,
      message: `Are you sure you want to ${action.toLowerCase()} ${emp.name} (${emp.employeeId})? This will ${action === 'Deactivate' ? 'prevent them from logging in' : 'restore their access'}.`,
      onConfirm: async () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
        const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
        try {
          await api.put(`/md/employees/${emp.id}/status`, { status: newStatus });
          showToast(
            `${emp.employeeId} ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully.`,
          );
          fetchData();
        } catch (err: any) {
          showToast(`Error: ${err.response?.data?.message || 'Status update failed.'}`);
        }
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await api.post('/md/employees/reset-password', {
        targetUserId: resetModal.employee?.id,
        targetUserType: 'Employee',
        newPassword,
      });
      showToast(`Password reset for ${resetModal.employee?.employeeId}.`);
      setResetModal({ open: false, employee: null });
      setNewPassword('');
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setResetLoading(false);
    }
  };

  const totalDEMs = dems.length;
  const activeDEMs = dems.filter((d) => d.status === 'Active').length;
  const inactiveDEMs = dems.filter((d) => d.status !== 'Active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading Data Entry Managers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-2xl border border-slate-700">
          {toast}
        </div>
      )}

      <PageHeader
        title="DEM Management"
        subtitle="Manage Data Entry Managers and their operational access."
        breadcrumb={['Management', 'Data Entry Managers']}
        action={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors">
            + Add DEM
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="Total DEMs" value={totalDEMs} icon={Users} color="blue" />
        <StatCard title="Active" value={activeDEMs} icon={UserCheck} color="green" />
        <StatCard title="Inactive" value={inactiveDEMs} icon={UserX} color="slate" />
      </div>

      {/* Role Description */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Activity className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Data Entry Manager Role</p>
          <p className="text-xs text-amber-700 mt-0.5">
            DEMs are responsible for data entry, payment logging, document management, customer
            onboarding, and operational records. They do NOT have project management permissions.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">All Data Entry Managers</h2>
          <span className="text-xs text-slate-400">
            {totalDEMs} record{totalDEMs !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['DEM', 'Employee ID', 'Phone', 'Email', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No Data Entry Managers found</p>
                    <p className="text-slate-400 text-xs mt-1">Add a DEM to get started.</p>
                  </td>
                </tr>
              ) : (
                dems.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {emp.employeeId}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{emp.phone}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{emp.email}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          title={emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${emp.status === 'Active' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          {emp.status === 'Active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setResetModal({ open: true, employee: emp });
                            setNewPassword('');
                            setResetError('');
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((d) => ({ ...d, open: false }))}
      />

      {/* Reset Password Modal */}
      {resetModal.open && resetModal.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-sm text-slate-500 mb-4">
              Setting new password for <strong>{resetModal.employee.name}</strong> (
              {resetModal.employee.employeeId})
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                  {resetError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setResetModal({ open: false, employee: null })}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />} Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
