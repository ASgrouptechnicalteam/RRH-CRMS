import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { MapPin, User, Calendar, CheckCircle, XCircle } from 'lucide-react';

export const AgentSiteVisitsDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/site-visits`);
      const data = await res.json();
      if (res.ok) {
        setVisits(data.visits || []);
      }
    } catch (err) {
      console.error('Failed to fetch visits', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (visitId: number, status: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/site-visits/${visitId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed: status === 'CONFIRMED' || status === 'COMPLETED',
          verification_notes: feedback[visitId] || 'Updated by Agent on field'
        })
      });
      if (res.ok) {
        alert(`Status updated to ${status}`);
        fetchVisits();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Agent Field Operations</h1>
          <p className="text-blue-200 text-sm sm:text-base font-medium max-w-xl">
            Welcome back, {user?.fullName || user?.employeeCode}. Here are your assigned site visits for today. 
            Remember to log customer feedback immediately after the visit.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 transform translate-x-8 -translate-y-8 pointer-events-none">
          <MapPin className="w-48 h-48" />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          My Assigned Site Visits
        </h2>

        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
        ) : visits.length === 0 ? (
          <div className="text-center p-8 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-100">
            No site visits assigned to you currently.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visits.map((visit) => (
              <div key={visit.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {visit.lead?.customer_name || 'Customer'}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium">{visit.lead?.phone || 'No phone provided'}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                    visit.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                    visit.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    visit.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {visit.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Location / Property</p>
                      <p className="text-sm font-semibold text-slate-800">{visit.lead?.preferred_location || 'Not Specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Scheduled Date</p>
                      <p className="text-sm font-semibold text-slate-800">{new Date(visit.scheduled_date).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {visit.status !== 'COMPLETED' && visit.status !== 'CANCELLED' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <textarea 
                      placeholder="Add customer feedback or notes here..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none outline-none"
                      rows={2}
                      value={feedback[visit.id] || ''}
                      onChange={(e) => setFeedback({...feedback, [visit.id]: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(visit.id, 'COMPLETED')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Completed
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(visit.id, 'CANCELLED')}
                        className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        No Show
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
