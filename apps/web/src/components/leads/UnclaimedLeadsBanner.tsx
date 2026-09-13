import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { ListWidget, ListItem } from '../ui';
import { handleApiError, toUserFacingError } from '../../utils/userFacingError';

interface UnclaimedLead {
  id: number;
  lead_code: string;
  customer_name: string;
  phone: string;
  preferred_location?: string | null;
  created_at: string;
}

// Leads that fell through auto-distribution entirely (no eligible telecaller
// existed at creation/recovery time — see the backend's distributionService)
// and so were never assigned to anyone. Rare in practice — most leads are
// auto-assigned instantly — so this renders nothing when the list is empty,
// same pattern as ActiveSiteVisitsBanner.
export const UnclaimedLeadsBanner: React.FC<{ onClaimed?: () => void }> = ({ onClaimed }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast, showError } = useToast();
  const [leads, setLeads] = useState<UnclaimedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const fetchUnclaimed = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/unclaimed`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to load unclaimed leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnclaimed();
    const interval = setInterval(fetchUnclaimed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (leadId: number) => {
    setClaimingId(leadId);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/claim`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Lead claimed — it now belongs to you.', 'success');
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        onClaimed?.();
      } else {
        await handleApiError(res, showError, data);
        fetchUnclaimed();
      }
    } catch (err) {
      showError(
        toUserFacingError({ message: err instanceof Error ? err.message : String(err), body: err }),
      );
    } finally {
      setClaimingId(null);
    }
  };

  if (loading || leads.length === 0) return null;

  const items: ListItem[] = leads.map((lead) => ({
    id: lead.id,
    icon: UserPlus,
    title: lead.customer_name || lead.lead_code,
    subtitle: [lead.preferred_location, lead.phone].filter(Boolean).join(' · '),
    meta: (
      <button
        disabled={claimingId === lead.id}
        onClick={(e) => {
          e.stopPropagation();
          handleClaim(lead.id);
        }}
        className="px-3 py-1.5 bg-action text-white text-xs font-bold rounded-lg shadow-sm hover:bg-action-600 transition-colors disabled:opacity-50"
      >
        {claimingId === lead.id ? 'Claiming...' : 'Claim'}
      </button>
    ),
  }));

  return (
    <div className="mb-6 rounded-2xl border-2 border-amber-300 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
      <ListWidget
        title="⚠️ Unclaimed Leads — didn't get auto-assigned, claim one to start working it"
        items={items}
        emptyStateMessage=""
      />
    </div>
  );
};
