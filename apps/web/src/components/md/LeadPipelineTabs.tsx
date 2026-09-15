import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

interface StageCount {
  status: string;
  count: number;
}

const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  DEMO_SCHEDULED: 'Demo Scheduled',
  DEMO_COMPLETED: 'Demo Completed',
  SITE_VISIT_SCHEDULED: 'Site Visit Scheduled',
  SITE_VISIT_COMPLETED: 'Site Visit Completed',
  NEGOTIATION: 'Negotiation',
  BOOKING_INITIATED: 'Booking Initiated',
  BOOKED: 'Booked',
};

// Polled rather than fetched once, so the counts on the MD/Admin dashboard
// stay current as leads move through the pipeline without a manual refresh.
const POLL_INTERVAL_MS = 20000;

export const LeadPipelineTabs: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [stages, setStages] = useState<StageCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/md/lead-pipeline-counts`);
        const data = await res.json();
        if (res.ok && !cancelled) {
          setStages(data.stages || []);
        }
      } catch (e) {
        console.error('Fetch lead pipeline counts error:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCounts();
    const timer = setInterval(fetchCounts, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fetchWithAuth]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-navy-900">Lead Pipeline</h3>
        <button
          onClick={() => navigate('/leads')}
          className="text-sm font-medium text-action hover:text-navy-700 transition-colors"
        >
          View All Leads →
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {(isLoading
          ? Object.keys(STAGE_LABELS).map((status) => ({ status, count: 0 }))
          : stages
        ).map((s) => (
          <button
            key={s.status}
            onClick={() => navigate('/leads')}
            className="shrink-0 min-w-[132px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-left transition-colors"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
              {STAGE_LABELS[s.status] || s.status}
            </p>
            <p className="text-xl font-bold text-navy-900 mt-1">{isLoading ? '...' : s.count}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
