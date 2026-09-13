import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Home, Loader2, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

// Was an "Add Property" form that originated catalog data directly in the
// portal's own database — removed (consolidation plan Decision 1).
// Properties now sync in from the CRM the moment a booking is confirmed
// there; creating a new one happens in the real CRM, not here.
export const MDProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const propRes = await api.get('/md/properties');
      setProperties(propRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Inventory"
        subtitle="Synced from the CRM when a booking is confirmed there."
        breadcrumb={['Management', 'Properties']}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Properties" value={properties.length} icon={Home} color="indigo" />
        <StatCard
          title="Available"
          value={properties.filter((p) => p.status === 'Available').length}
          icon={Home}
          color="green"
        />
        <StatCard
          title="Sold/Booked"
          value={properties.filter((p) => p.status === 'Sold' || p.status === 'Booked').length}
          icon={Home}
          color="blue"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">All Properties</h2>
            <button
              onClick={fetchData}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Property (Type/Plot)</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Area (SqFt)</th>
                  <th className="px-5 py-3">Value/SqFt (₹)</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No properties synced yet
                    </td>
                  </tr>
                )}
                {properties.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {p.type} - {p.propertyNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-500">{p.project?.name}</td>
                    <td className="px-5 py-4 text-slate-600">{p.area}</td>
                    <td className="px-5 py-4 text-slate-600">₹{p.price}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
