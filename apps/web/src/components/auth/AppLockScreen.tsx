import React, { useState } from 'react';
import { Fingerprint, LogOut, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { unlockWithAppLock } from '../../api/appLock';

// § Phase 6 — full-screen gate shown whenever AuthContext reports isLocked.
// No access token exists while this is up (AuthContext clears it on lock),
// so the only way past this screen is a real, verified WebAuthn assertion —
// there is nothing here for a UI-only bypass to defeat.
export const AppLockScreen: React.FC = () => {
  const { user, logout, unlockSession } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    if (!user) return;
    setIsUnlocking(true);
    setError(null);
    try {
      const verified = await unlockWithAppLock(user.id);
      if (verified) {
        await unlockSession();
      } else {
        setError('Could not verify — please try again.');
      }
    } catch (e) {
      setError('Unlock was cancelled or failed. Try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800">
          <Fingerprint className="h-8 w-8 text-indigo-400" />
        </div>
        <h1 className="text-lg font-semibold text-white">App Locked</h1>
        <p className="mt-1 text-sm text-slate-400">
          {user?.fullName ? `Welcome back, ${user.fullName}` : 'Welcome back'} — unlock to continue.
        </p>

        {error && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleUnlock}
          disabled={isUnlocking}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-3 transition-colors"
        >
          {isUnlocking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for device...
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4" />
              Unlock
            </>
          )}
        </button>

        <button
          onClick={() => logout()}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 text-sm py-2.5 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out instead
        </button>
      </div>
    </div>
  );
};
