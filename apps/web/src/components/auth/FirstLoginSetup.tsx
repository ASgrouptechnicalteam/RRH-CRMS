import React, { useState } from 'react';
import { Lock, User, Key, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';
import { handleApiError, toUserFacingError } from '../../utils/userFacingError';

export const FirstLoginSetup: React.FC = () => {
  const { user, fetchWithAuth, setFirstLoginDone, login } = useAuth();
  const { showToast , showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError({ message: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      showError({ message: 'Password must be at least 8 characters long' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Security setup complete! Password updated.', 'success');
        if (data.accessToken && data.user) {
          login(data.user, data.accessToken);
        } else {
          setFirstLoginDone(true);
        }
      } else {
          await handleApiError(res, showError, data);
        }
    } catch (e) {
      showError(toUserFacingError({ message: e instanceof Error ? e.message : String(e), body: e })); } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden animate-scaleUp">
        <div className="flex flex-col items-center justify-center mb-6 mt-4">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mb-3">
            <ShieldCheck className="w-8 h-8 text-navy-700" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 text-center">Security Setup Required</h2>
          <p className="text-sm text-slate-500 text-center mt-2 px-4">
            Hi {user?.fullName || 'User'}, for your account's security, please update your default password before accessing the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current (Default) Password</label>
            <div className="relative">
              <Key className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500"
                placeholder="Enter current password"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500"
                placeholder="At least 8 characters"
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
            <div className="relative">
              <CheckCircle2 className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500"
                placeholder="Type new password again"
                minLength={8}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isLoading ? 'Updating...' : 'Update Password & Continue'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl flex gap-2 items-start border border-amber-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            Never share your password with anyone. Administrators will never ask for your password.
          </p>
        </div>
      </div>
    </div>
  );
};
