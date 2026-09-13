import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const GlobalPopupManager = () => {
  const { user } = useAuth();
  const [popups, setPopups] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchPopups = async () => {
      try {
        const res = await api.get('/system/content/active');
        if (res.data.popups && res.data.popups.length > 0) {
          setPopups(res.data.popups);
          // Track displayed
          api.post(`/system/content/popups/${res.data.popups[0].id}/track`, {
            eventType: 'displayed',
          });
          api.post(`/system/content/popups/${res.data.popups[0].id}/track`, {
            eventType: 'viewed',
          });
        }
      } catch (err) {
        console.error('Failed to load popups', err);
      }
    };
    fetchPopups();
  }, []);

  const handleDismiss = () => {
    const currentPopup = popups[currentIndex];
    api.post(`/system/content/popups/${currentPopup.id}/track`, { eventType: 'dismissed' });

    if (currentIndex < popups.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      api.post(`/system/content/popups/${popups[currentIndex + 1].id}/track`, {
        eventType: 'displayed',
      });
      api.post(`/system/content/popups/${popups[currentIndex + 1].id}/track`, {
        eventType: 'viewed',
      });
    } else {
      setPopups([]); // Close all
    }
  };

  const handleActionClick = () => {
    const currentPopup = popups[currentIndex];
    api.post(`/system/content/popups/${currentPopup.id}/track`, { eventType: 'clicked' });
    if (currentPopup.actionUrl) {
      window.open(currentPopup.actionUrl, '_blank');
    }
    handleDismiss();
  };

  if (popups.length === 0) return null;

  const popup = popups[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {popup.imageUrl && (
          <img src={popup.imageUrl} alt={popup.title} className="w-full h-48 object-cover" />
        )}

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{popup.title}</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">{popup.message}</p>

          <div className="flex gap-3">
            {popup.actionUrl && (
              <button
                onClick={handleActionClick}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Learn More
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
