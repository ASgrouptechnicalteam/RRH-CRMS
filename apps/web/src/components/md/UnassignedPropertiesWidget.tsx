import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { ListWidget, ListItem } from '../ui';
import { AlertCircle, Building } from 'lucide-react';
import { formatEmployeeLabel } from '../../utils/employeeLabel';

// A Project has its own independent assigned_pm_id (not shared with its
// units — see siteVisit routing, which resolves the PM from the Project),
// so a widget that only ever looked at unassigned standalone Properties was
// silently missing every unassigned Project (and, by extension, every unit
// inside it left without a routed PM). Both kinds are now listed together.
type UnassignedItem = { id: number; kind: 'PROPERTY' | 'PROJECT'; title: string; subtitle: string };

export const UnassignedPropertiesWidget: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [items, setItems] = useState<UnassignedItem[]>([]);
  const [pms, setPms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, projectRes, pmRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/properties?unassigned=true&limit=10`),
        fetchWithAuth(`${API_BASE_URL}/projects?unassigned=true&limit=10`),
        fetchWithAuth(`${API_BASE_URL}/employees?role=PROJECT_MANAGER`),
      ]);
      const nextItems: UnassignedItem[] = [];
      if (propRes.ok) {
        const propData = await propRes.json();
        (propData.properties || []).forEach((p: any) =>
          nextItems.push({
            id: p.id,
            kind: 'PROPERTY',
            title: `${p.title} (${p.property_code})`,
            subtitle: `Location: ${p.city || p.location || 'Unknown'}`,
          }),
        );
      }
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        (projectData.projects || []).forEach((proj: any) =>
          nextItems.push({
            id: proj.id,
            kind: 'PROJECT',
            title: `${proj.name} (Project)`,
            subtitle: `Location: ${proj.city || proj.location || 'Unknown'}`,
          }),
        );
      }
      setItems(nextItems);
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

  const handleAssign = async (item: UnassignedItem, pmId: string) => {
    if (!pmId) return;
    setAssigningId(item.id);
    try {
      const endpoint =
        item.kind === 'PROPERTY'
          ? `${API_BASE_URL}/properties/${item.id}`
          : `${API_BASE_URL}/projects/${item.id}`;
      const res = await fetchWithAuth(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_pm_id: parseInt(pmId, 10) }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => !(i.id === item.id && i.kind === item.kind)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAssigningId(null);
    }
  };

  const listItems: ListItem[] = items.map((item) => ({
    id: `${item.kind}-${item.id}`,
    title: item.title,
    subtitle: item.subtitle,
    icon: Building,
    meta: (
      <div className="flex items-center gap-2">
        <select
          className="text-sm text-slate-800 bg-white border border-slate-200 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:opacity-50"
          onChange={(e) => handleAssign(item, e.target.value)}
          defaultValue=""
          disabled={assigningId === item.id}
        >
          <option value="" disabled className="text-slate-800 bg-white">
            Assign PM...
          </option>
          {pms.map((pm) => (
            <option key={pm.id} value={pm.id} className="text-slate-800 bg-white">
              {formatEmployeeLabel(pm)}
            </option>
          ))}
        </select>
        {assigningId === item.id && (
          <AlertCircle className="w-4 h-4 text-slate-400 animate-pulse" />
        )}
      </div>
    ),
  }));

  return (
    <ListWidget
      title="Unassigned Properties & Projects"
      items={listItems}
      emptyStateMessage={
        loading ? 'Loading...' : 'All properties and projects have an assigned PM.'
      }
    />
  );
};
