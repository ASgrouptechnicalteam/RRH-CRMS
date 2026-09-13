import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Bell, Check, CheckCircle2 } from 'lucide-react';

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/system/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/system/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/system/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-slate-500">Loading notifications...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notification Center</h2>
          <p className="text-slate-500">Stay updated on your property portfolio.</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <CheckCircle2 className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-6 flex gap-4 ${notif.isRead ? 'bg-white' : 'bg-blue-50/50'}`}
            >
              <div
                className={`p-3 rounded-full h-fit shrink-0 ${notif.isRead ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4
                    className={`font-semibold ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}
                  >
                    {notif.title}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-sm ${notif.isRead ? 'text-slate-500' : 'text-slate-700'}`}>
                  {notif.message}
                </p>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors h-fit"
                  title="Mark as read"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p>You have no notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
