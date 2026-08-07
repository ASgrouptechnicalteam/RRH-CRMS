import React, { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

export const NotificationDrawer: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/notifications`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
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
    } catch (e) {
      console.error('Failed to mark notification read');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h4 className="font-bold text-sm text-slate-800">Notifications</h4>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No notifications right now.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs transition-colors flex items-start justify-between ${
                    n.is_read ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-teal-50/50 border-teal-200 text-slate-800 font-medium'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-teal-900 block">{n.title}</span>
                    <p className="text-[11px] leading-tight">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1 text-teal-700 hover:bg-teal-100 rounded"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
