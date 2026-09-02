/**
 * NotificationDrawer.tsx
 *
 * Bell icon with dropdown panel for in-app notifications.
 * Also manages the floating NotificationToast and notification sounds.
 *
 * Features:
 *  - Polls /api/v1/notifications every 30s
 *  - Shows unread badge count on bell icon
 *  - Plays the selected sound when a new notification arrives
 *  - Shows a native-app-style floating toast for new notifications
 *  - Mark individual notifications as read
 *  - Mark all as read
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NotificationItem } from '../../types';
import { Bell, Check, X, CheckCheck, Info, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { NotificationToast } from './NotificationToast';
import { playNotificationSound, getStoredTone } from '../../hooks/useNotificationSound';

function getTypeColor(type?: string) {
  switch (type) {
    case 'LEAVE_APPROVED': return 'bg-emerald-100 text-emerald-700';
    case 'LEAVE_REJECTED': return 'bg-red-100 text-red-700';
    case 'SYSTEM': return 'bg-amber-100 text-amber-700';
    default: return 'bg-navy-100 text-navy-700';
  }
}

function getTypeLabel(type?: string) {
  if (!type) return 'Notification';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const NotificationDrawer: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const prevIdsRef = useRef<Set<number>>(new Set());
  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/notifications`);
      const data = await res.json();
      if (!res.ok) return;

      const fetched: NotificationItem[] = data.notifications || [];
      setUnreadCount(data.unreadCount || 0);
      setNotifications(fetched);

      // Detect genuinely new (unread) notifications
      const newOnes = fetched.filter(
        (n) => !n.is_read && !prevIdsRef.current.has(n.id)
      );

      if (newOnes.length > 0 && prevIdsRef.current.size > 0) {
        // Play sound (only for first new one to avoid noise)
        const tone = getStoredTone();
        playNotificationSound(tone);
        // Show toast for the newest
        setToast(newOnes[0]);
      }

      // Update the set of known IDs
      fetched.forEach((n) => prevIdsRef.current.add(n.id));
    } catch (e) {
      // Silently ignore — polling will retry
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unread.map((n) =>
          fetchWithAuth(`${API_BASE_URL}/notifications/${n.id}/read`, { method: 'PATCH' })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <>
      {/* Toast */}
      <NotificationToast
        notification={toast}
        onDismiss={() => setToast(null)}
      />

      {/* Bell Icon + Drawer */}
      <div className="relative" ref={drawerRef}>
        <button
          onClick={() => {
            setIsOpen((o) => !o);
            if (!isOpen) fetchNotifications(); // refresh on open
          }}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          title="Notifications"
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-[wiggle_1s_ease-in-out]' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center px-0.5 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-[340px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-navy-50 dark:from-slate-700 to-slate-50 dark:to-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-navy-700 dark:text-navy-300" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-navy-600 dark:text-navy-300 hover:text-navy-800 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-navy-50 dark:hover:bg-slate-700 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    All read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No notifications right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors group hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
                        !n.is_read ? 'bg-navy-50/40 dark:bg-navy-900/20' : ''
                      }`}
                      onClick={() => {
                        handleMarkRead(n.id);
                        if (n.link) window.location.href = n.link;
                      }}
                    >
                      {/* Unread dot */}
                      <div className="mt-1.5 shrink-0">
                        <span className={`block w-2 h-2 rounded-full ${!n.is_read ? 'bg-navy-500' : 'bg-transparent'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-1 ${getTypeColor(n.type)}`}>
                              {getTypeLabel(n.type)}
                            </span>
                            <p className={`text-sm font-semibold ${!n.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                          </div>
                          {!n.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                              className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-slate-600 rounded-lg transition-all"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">Last updated just now</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
