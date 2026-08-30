import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

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

interface KioskCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: KioskCredential | null;
  branches: Branch[];
}

export const KioskCredentialModal: React.FC<KioskCredentialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  branches,
}) => {
  const [label, setLabel] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setLabel(initialData.label);
        setUsername(initialData.username);
        setBranchId(initialData.branch_id);
        setIsActive(initialData.is_active);
        setPassword('');
      } else {
        setLabel('');
        setUsername('');
        setBranchId(branches.length === 1 ? branches[0].id : '');
        setIsActive(true);
        setPassword('');
      }
    }
  }, [isOpen, initialData, branches]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        label,
        branch_id: Number(branchId),
      };

      if (!initialData) {
        payload.username = username;
        payload.password = password;
      } else {
        payload.is_active = isActive;
        if (password) {
          payload.password = password;
        }
      }

      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-navy-900">
            {initialData ? 'Edit Kiosk Credential' : 'Create Kiosk Credential'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors"
            >
              <option value="" disabled>Select a branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Label (e.g. Front Desk)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="Main Reception Kiosk"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={!!initialData}
              placeholder="KIOSK-001"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500"
            />
            {initialData && (
              <p className="text-xs text-slate-500 mt-1">Username cannot be changed after creation.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {initialData ? 'Reset Password (Optional)' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!initialData}
              placeholder={initialData ? "Leave blank to keep current" : "••••••••"}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors"
            />
            {initialData && password && (
              <div className="flex items-start gap-2 mt-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium">Changing the password will immediately invalidate all active kiosk sessions using this credential.</p>
              </div>
            )}
          </div>

          {initialData && (
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">Account Active</span>
                  <span className="text-xs text-slate-500">
                    {isActive ? 'Kiosk can log in and scan' : 'Kiosk login is disabled'}
                  </span>
                </div>
              </label>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-navy-700 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Credential')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
