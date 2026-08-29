import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { ListWidget, ListItem } from '../ui';
import { AlertCircle, Building } from 'lucide-react';

export const UnassignedPropertiesWidget: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [pms, setPms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, pmRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/properties?unassigned=true&limit=10`),
        fetchWithAuth(`${API_BASE_URL}/employees?role=Project%20manager`)
      ]);
      if (propRes.ok) {
        const propData = await propRes.json();
        setProperties(propData.properties || []);
      }
      if (pmRes.ok) {
        const pmData = await pmRes.json();
        setPms(pmData.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (propertyId: number, pmId: string) => {
    if (!pmId) return;
    setAssigningId(propertyId);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assigned_pm_id: parseInt(pmId, 10) })
      });
      if (res.ok) {
        setProperties(prev => prev.filter(p => p.id !== propertyId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAssigningId(null);
    }
  };

  const listItems: ListItem[] = properties.map(p => ({
    id: p.id,
    title: `${p.title} (${p.property_code})`,
    subtitle: `Location: ${p.city || p.location || 'Unknown'}`,
    icon: Building,
    meta: (
      <div className="flex items-center gap-2">
        <select 
          className="text-sm border border-slate-200 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:opacity-50"
          onChange={(e) => handleAssign(p.id, e.target.value)}
          defaultValue=""
          disabled={assigningId === p.id}
        >
          <option value="" disabled>Assign PM...</option>
          {pms.map(pm => (
            <option key={pm.id} value={pm.id}>{pm.full_name || pm.employee_code}</option>
          ))}
        </select>
        {assigningId === p.id && <AlertCircle className="w-4 h-4 text-slate-400 animate-pulse" />}
      </div>
    )
  }));

  return (
    <ListWidget 
      title="Unassigned Properties"
      items={listItems}
      emptyStateMessage={loading ? "Loading..." : "All properties have an assigned PM."}
    />
  );
};
