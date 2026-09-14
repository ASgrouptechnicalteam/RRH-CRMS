import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ListWidget, ListItem, StatusPill } from '../ui';
import { SiteVisitCountdownBadge } from './SiteVisitCountdownBadge';

interface SiteVisit {
  id: number;
  booking_code: string;
  status: string;
  scheduled_date: string;
  lead?: { customer_name: string; phone: string; preferred_location?: string };
  property?: { title: string; property_code: string };
  project_unit?: {
    unit_number: string;
    flat_number?: string | null;
    villa_number?: string | null;
    plot_number?: string | null;
    project: { name: string };
  };
}

export const ActiveSiteVisitsBanner: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [activeVisits, setActiveVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveVisits = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/site-visits?status=ACTIVE`);
        if (res.ok) {
          const data = await res.json();
          const today = new Date().toISOString().split('T')[0];
          const todayVisits = (data.visits || []).filter(
            (v: SiteVisit) => v.scheduled_date && v.scheduled_date.startsWith(today),
          );
          setActiveVisits(todayVisits);
        }
      } catch (err) {
        console.error('Failed to load active site visits', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveVisits();
    const interval = setInterval(fetchActiveVisits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWithAuth]);

  if (loading || activeVisits.length === 0) return null;

  // These visits are already ACTIVE (i.e. accepted), so the customer phone
  // number is no longer blind-queue-restricted — safe to show unconditionally.
  const items: ListItem[] = activeVisits.map((visit) => ({
    id: visit.id,
    icon: MapPin,
    title: visit.project_unit
      ? `${visit.project_unit.project.name} — Unit ${
          visit.project_unit.flat_number ||
          visit.project_unit.villa_number ||
          visit.project_unit.plot_number ||
          visit.project_unit.unit_number
        }`
      : visit.property?.title || 'Unknown Property',
    subtitle: [
      visit.lead?.customer_name || 'Unknown Client',
      visit.lead?.preferred_location,
      visit.lead?.phone,
    ]
      .filter(Boolean)
      .join(' · '),
    meta: (
      <div className="flex flex-col items-end gap-2">
        <SiteVisitCountdownBadge scheduledDate={visit.scheduled_date} />
        <StatusPill status="ACTIVE TODAY" type="success" />
        {visit.lead?.phone && (
          <a
            href={`tel:${visit.lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-action hover:underline"
          >
            <Phone className="w-3 h-3" />
            {visit.lead.phone}
          </a>
        )}
        <button
          className="px-3 py-1 bg-action text-white text-xs font-bold rounded shadow-sm hover:bg-action-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/site-visits');
          }}
        >
          View Details
        </button>
      </div>
    ),
  }));

  return (
    <div className="mb-6 rounded-2xl border-2 border-action shadow-md shadow-action/10 relative overflow-hidden bg-white">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-action to-blue-400"></div>
      <ListWidget title="⚠️ URGENT: Active Site Visits Today" items={items} emptyStateMessage="" />
    </div>
  );
};
