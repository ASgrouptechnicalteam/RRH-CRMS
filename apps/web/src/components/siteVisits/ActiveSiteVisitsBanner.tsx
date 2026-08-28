import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { MapPin, Calendar, User, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ListWidget, ListItem, StatusPill } from '../ui';

interface SiteVisit {
  id: number;
  booking_code: string;
  status: string;
  scheduled_date: string;
  lead?: {
    customer_name: string;
    contact_number: string;
  };
  property?: {
    title: string;
    property_code: string;
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
          // Filter for today's visits if they aren't already filtered on the backend
          const today = new Date().toISOString().split('T')[0];
          const todayVisits = (data.visits || []).filter((v: SiteVisit) => 
            v.scheduled_date && v.scheduled_date.startsWith(today)
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
    // Poll every 5 minutes to keep it fresh
    const interval = setInterval(fetchActiveVisits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWithAuth]);

  if (loading || activeVisits.length === 0) return null;

  const items: ListItem[] = activeVisits.map((visit) => ({
    id: visit.id,
    icon: MapPin,
    title: visit.property?.title || 'Unknown Property',
    subtitle: `${visit.lead?.customer_name || 'Unknown Client'} - ${new Date(visit.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    meta: (
      <div className="flex flex-col items-end gap-2">
        <StatusPill status="ACTIVE TODAY" type="success" />
        <button 
          className="px-3 py-1 bg-action text-white text-xs font-bold rounded shadow-sm hover:bg-action-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/site-visits/${visit.id}`);
          }}
        >
          View Details
        </button>
      </div>
    )
  }));

  return (
    <div className="mb-6 rounded-2xl border-2 border-action shadow-md shadow-action/10 relative overflow-hidden bg-white">
      {/* Visual distinct top border highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-action to-blue-400"></div>
      <ListWidget 
        title="⚠️ URGENT: Active Site Visits Today"
        items={items}
        emptyStateMessage=""
      />
    </div>
  );
};
