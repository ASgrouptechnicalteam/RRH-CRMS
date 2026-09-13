import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { ListWidget, ListItem } from '../ui/ListWidget';

interface EscalatedVisit {
  id: number;
  booking_code: string;
  scheduled_date: string;
  lead?: { customer_name?: string } | null;
}

/** Site visits with no PM/Agent left to route to, escalated straight to the
 * MD (see routes/siteVisits.ts's POST /:id/escalate). Read-only summary here
 * — reassigning/accepting is done from the full Site Visit Management page
 * (viewAllLink below) so this widget doesn't duplicate that action logic. */
export const MDEscalationQueue: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [visits, setVisits] = useState<EscalatedVisit[]>([]);

  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/site-visits?status=ESCALATED_TO_MARKETING_DIRECTOR`)
      .then((res) => res.json())
      .then((data) => setVisits(data.visits || []))
      .catch(() => {});
  }, [fetchWithAuth]);

  const items: ListItem[] = visits.map((v) => ({
    id: v.id,
    icon: AlertTriangle,
    title: v.lead?.customer_name || v.booking_code,
    subtitle: `Visit ${v.booking_code} — escalated, no PM/agent available`,
    meta: (
      <span className="text-xs text-slate-400 whitespace-nowrap">
        {new Date(v.scheduled_date).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'short',
        })}
      </span>
    ),
    link: '/site-visits',
  }));

  return (
    <ListWidget
      title="Escalated Site Visits"
      items={items}
      emptyStateMessage="No site visits currently escalated to you."
      viewAllLink="/site-visits"
    />
  );
};
