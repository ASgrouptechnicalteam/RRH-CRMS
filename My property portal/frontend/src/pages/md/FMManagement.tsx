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
  Link as LinkIcon,
  KeyRound,
  AlertCircle,
  Loader2,
  RefreshCw,
  MapPin,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  role: { name: string };
  assignments?: { project: { name: string; code: string } }[];
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

export const FMManagement = () => {
  const [fms, setFms] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [assignModal, setAssignModal] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
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
      const [empRes, projRes] = await Promise.all([
        api.get('/md/employees'),
        api.get('/md/projects'),
      ]);
      const allEmployees: Employee[] = empRes.data;
      // Fetch each FM's assignment separately since backend returns basic list
      const fmList = allEmployees.filter((e: Employee) => e.role?.name === 'FM');
      setFms(fmList);
      setProjects(projRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load FM data.');
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
      message: `Are you sure you want to ${action.toLowerCase()} ${emp.name} (${emp.employeeId})?`,
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

  const openAssignModal = async (emp: Employee) => {
    setAssignError('');
    setSelectedProjectId('');
    setAssignModal({ open: true, employee: emp });
  };

  const handleAssign = async () => {
    if (!selectedProjectId || !assignModal.employee) return;
    setAssigning(true);
    setAssignError('');
    try {
      await api.post('/md/assignments', {
        employeeId: assignModal.employee.id,
        projectId: selectedProjectId,
      });
      showToast(`${assignModal.employee.employeeId} assigned successfully.`);
      setAssignModal({ open: false, employee: null });
      fetchData();
    } catch (err: any) {
      setAssignError(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  const totalFMs = fms.length;
  const activeFMs = fms.filter((f) => f.status === 'Active').length;
  const inactiveFMs = fms.filter((f) => f.status !== 'Active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading Field Managers...</span>
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
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <PageHeader
        title="FM Management"
        subtitle="Manage Field Managers, project assignments, status, and operational activity."
        breadcrumb={['Management', 'Field Managers']}
        action={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors">
            + Add Field Manager
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total FMs" value={totalFMs} icon={Users} color="blue" />
        <StatCard title="Active" value={activeFMs} icon={UserCheck} color="green" />
        <StatCard title="Inactive" value={inactiveFMs} icon={UserX} color="slate" />
        <StatCard title="Projects" value={projects.length} icon={MapPin} color="indigo" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">All Field Managers</h2>
          <span className="text-xs text-slate-400">
            {totalFMs} record{totalFMs !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['FM', 'Employee ID', 'Phone', 'Assigned Project', 'Status', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No Field Managers found</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Add a Field Manager to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                fms.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
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
                    <td className="px-5 py-4">
                      <span className="text-slate-500 text-xs">—</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openAssignModal(emp)}
                          title="Assign Project"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((d) => ({ ...d, open: false }))}
      />

      {/* Assign Project Modal */}
      {assignModal.open && assignModal.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Assign Project</h3>
            <p className="text-sm text-slate-500 mb-5">
              Field Managers can only be assigned to one project at a time.
            </p>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">FM</span>
                  <span className="font-semibold text-slate-900">{assignModal.employee.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee ID</span>
                  <span className="font-mono text-xs text-slate-700">
                    {assignModal.employee.employeeId}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Select Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">— Select a project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {assignError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {assignError}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setAssignModal({ open: false, employee: null })}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedProjectId || assigning}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
              >
                {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                Assign Project
              </button>
            </div>
          </div>
        </div>
      )}

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
