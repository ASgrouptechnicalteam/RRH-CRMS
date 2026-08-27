import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, ToggleLeft, ToggleRight, Search, Building2, QrCode, X, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { EmployeeListItem } from '../../types';
import { QRCodeVisual } from '../common/QRCodeVisual';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export const MDControlDashboard: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Production Toast Feedback Notification State
  const [toast, setToast] = useState<ToastState | null>(null);

  // Selected Employee QR Badge Modal
  const [selectedQrEmployee, setSelectedQrEmployee] = useState<EmployeeListItem | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/md/employees`);
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error('Failed to load employee list');
      triggerToast('Failed to load employee list from server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleToggleAttendance = async (employeeId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const targetEmp = employees.find((e) => e.id === employeeId);
    const empCode = targetEmp?.employeeCode || `Employee #${employeeId}`;

    // Optimistic UI update for instant zero-delay visual feedback
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === employeeId ? { ...emp, attendanceRequired: newStatus } : emp))
    );
    setUpdatingId(employeeId);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/md/employees/${employeeId}/attendance-requirement`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceRequired: newStatus }),
      });

      if (res.ok) {
        const statusLabel = newStatus ? 'REQUIRED' : 'EXEMPTED';
        triggerToast(`Attendance requirement for ${empCode} set to ${statusLabel}`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        // Revert optimistic update if API call fails
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === employeeId ? { ...emp, attendanceRequired: currentStatus } : emp))
        );
        triggerToast(err.error || `Failed to update attendance requirement for ${empCode}`, 'error');
      }
    } catch (e) {
      // Revert optimistic update on network error
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === employeeId ? { ...emp, attendanceRequired: currentStatus } : emp))
      );
      triggerToast(`Network error while updating ${empCode}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.roles.some((r: string) => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60 shadow-emerald-950/20'
              : 'bg-rose-900/90 text-rose-100 border-rose-700/60 shadow-rose-950/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold tracking-wide">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-teal-700" />
          <div>
            <h3 className="text-lg font-bold text-slate-800">MD Employee Control & Attendance Exemption</h3>
            <p className="text-xs text-slate-500">Configure employee QR badges, role privileges, and exemptions</p>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search code, branch, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading team members...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">No employees found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Branch Location</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">QR Badge</th>
                <th className="py-3 px-4 text-center">Attendance Exemption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-900">
                    {emp.employeeCode}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {emp.branch}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {emp.roles.map((r: string) => (
                        <span key={r} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedQrEmployee(emp)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 mx-auto border border-slate-300"
                    >
                      <QrCode className="w-3.5 h-3.5 text-teal-700" />
                      <span>QR Badge</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleAttendance(emp.id, emp.attendanceRequired)}
                      disabled={updatingId === emp.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                        emp.attendanceRequired
                          ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {emp.attendanceRequired ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-teal-700" />
                          <span>Required</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                          <span>Exempted</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee QR Badge Modal */}
      {selectedQrEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center relative animate-scaleUp">
            <button
              onClick={() => setSelectedQrEmployee(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center mx-auto mb-2">
              <QrCode className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-slate-800 text-base">Employee QR Badge</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedQrEmployee.employeeCode} • {selectedQrEmployee.branch}</p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 my-4 flex justify-center">
              <QRCodeVisual
                value={`RRH-EMP-${selectedQrEmployee.employeeCode}-${selectedQrEmployee.id}`}
                size={180}
                label={selectedQrEmployee.employeeCode}
              />
            </div>

            <p className="text-[11px] text-slate-400 font-mono mb-4">Official Employee ID QR Badge for Office Entry</p>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Employee QR Badge</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
