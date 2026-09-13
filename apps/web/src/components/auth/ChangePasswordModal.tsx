import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

export const ChangePasswordModal: React.FC = () => {
  const { fetchWithAuth, setFirstLoginDone, login } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setErrorMessage('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setErrorMessage('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setErrorMessage('Password must contain at least one number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setErrorMessage('Password must contain at least one special character');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      if (data.accessToken && data.user) {
        login(data.user, data.accessToken);
      } else {
        setFirstLoginDone(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-slate-100 animate-scaleUp max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Action Required</h2>
          <p className="text-xs text-slate-500 mt-1">
            First Login Password Change Required for Security
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="8+ chars, upper, lower, number, symbol"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-navy-700 hover:bg-navy-800 text-white font-medium rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Update Password & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
