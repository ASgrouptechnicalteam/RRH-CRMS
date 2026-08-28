import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { Moon, Sun, Monitor, Bell, BellOff, Navigation, User, Lock, LogOut } from 'lucide-react';

export const UserSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const { isSupported, permission, isSubscribing, subscribe, unsubscribe } = usePushNotifications();
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  
  const persistKey = `rrh_sidebar_persist_off_${user?.id || 'default'}`;
  const [rememberNav, setRememberNav] = useState(() => {
    return localStorage.getItem(persistKey) !== 'true';
  });

  useEffect(() => {
    if (rememberNav) {
      localStorage.removeItem(persistKey);
    } else {
      localStorage.setItem(persistKey, 'true');
      // Also clear the existing memory
      localStorage.removeItem(`rrh_sidebar_state_${user?.id || 'default'}`);
      localStorage.removeItem(`rrh_mobile_nav_state_${user?.id || 'default'}`);
    }
  }, [rememberNav, user?.id]);

  const handleNotificationsToggle = async () => {
    if (permission === 'granted') {
      await unsubscribe();
      // To fully reflect "off" in UI without reloading, we'd need a local state, but since it's browser level, 
      // they might have to revoke permission in browser. We'll just call unsubscribe.
      alert('Unsubscribed from push notifications. You may need to disable them in your browser settings to prevent future prompts.');
    } else if (permission === 'default' || permission === 'denied') {
      await subscribe();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Personal Settings</h1>
        <p className="text-slate-500">Manage your individual application preferences.</p>
      </div>

      {/* APPEARANCE */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Appearance</h2>
          <p className="text-sm text-slate-500">Customize the application theme.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <button 
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${theme === 'light' ? 'border-navy-600 bg-navy-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
          >
            <Sun className={`w-8 h-8 mb-2 ${theme === 'light' ? 'text-navy-700' : 'text-slate-400'}`} />
            <span className={`font-semibold ${theme === 'light' ? 'text-navy-800' : 'text-slate-600'}`}>Light</span>
          </button>
          
          <button 
            disabled
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
          >
            <Moon className="w-8 h-8 mb-2 text-slate-400" />
            <span className="font-semibold text-slate-600">Dark (Coming Soon)</span>
          </button>
          
          <button 
            disabled
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
          >
            <Monitor className="w-8 h-8 mb-2 text-slate-400" />
            <span className="font-semibold text-slate-600">System (Coming Soon)</span>
          </button>
        </div>
      </section>

      {/* NOTIFICATIONS */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
          <p className="text-sm text-slate-500">Manage real-time alerts and push notifications.</p>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${permission === 'granted' ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-500'}`}>
              {permission === 'granted' ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-slate-800">Push Notifications</p>
              <p className="text-xs text-slate-500">
                {!isSupported ? 'Not supported in this browser' : 
                  permission === 'denied' ? 'Blocked by browser settings' : 
                  'Receive real-time lead and task alerts'}
              </p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={permission === 'granted'}
              disabled={!isSupported || permission === 'denied' || isSubscribing}
              onChange={handleNotificationsToggle}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600 disabled:opacity-50"></div>
          </label>
        </div>
      </section>

      {/* NAVIGATION */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Navigation</h2>
          <p className="text-sm text-slate-500">Configure how the application menus behave.</p>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-navy-50 text-navy-700">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Remember Sidebar State</p>
              <p className="text-xs text-slate-500">Keep menu groups expanded/collapsed across visits</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={rememberNav}
              onChange={(e) => setRememberNav(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>
      </section>

      {/* ACCOUNT */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Account</h2>
          <p className="text-sm text-slate-500">Manage your profile and security credentials.</p>
        </div>
        
        <div className="pt-2 space-y-3">
          <a href="/profile" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">View Profile</p>
                <p className="text-xs text-slate-500">See your employment and contact details</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm font-medium">View &rarr;</span>
          </a>

          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Change Password</p>
                <p className="text-xs text-slate-500">Update your account access credentials</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm font-medium">Update &rarr;</span>
          </button>

          <button 
            onClick={logout}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-700 group-hover:bg-red-200 transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-red-700 text-sm">Sign Out</p>
                <p className="text-xs text-red-500">End your current session</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <ChangePasswordModal />
          </div>
        </div>
      )}
    </div>
  );
};
