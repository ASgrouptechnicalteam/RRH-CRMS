import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';

export const Customer360 = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customer360, setCustomer360] = useState<any | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loading360, setLoading360] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/md/customers');
        setCustomers(res.data);
      } catch (error) {
        console.error('Failed to fetch customers', error);
      } finally {
        setLoadingList(false);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      const fetch360 = async () => {
        setLoading360(true);
        try {
          const res = await api.get(`/md/customers/${selectedCustomerId}/360`);
          setCustomer360(res.data);
        } catch (error) {
          console.error('Failed to fetch 360 data', error);
        } finally {
          setLoading360(false);
        }
      };
      fetch360();
    } else {
      setCustomer360(null);
    }
  }, [selectedCustomerId]);

  if (loadingList) return <div className="text-white">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Customer 360 View</h2>
      <p className="text-slate-400">
        Select a customer from the directory to view their complete profile, properties, financial
        history, and timeline.
      </p>

      <div className="flex gap-6">
        {/* Customer List */}
        <div className="w-1/3 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col max-h-[800px]">
          <div className="p-4 border-b border-slate-700 bg-slate-900/50">
            <h3 className="font-semibold text-white">Customers</h3>
          </div>
          <div className="overflow-y-auto flex-1">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomerId(c.id)}
                className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors ${selectedCustomerId === c.id ? 'bg-blue-600/20 border-l-4 border-l-blue-500' : 'hover:bg-slate-700/50'}`}
              >
                <div className="font-medium text-white">{c.name}</div>
                <div className="text-sm text-slate-400">{c.phone}</div>
                <div className="text-xs text-slate-500">{c.email}</div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="p-4 text-slate-500">No customers found.</div>
            )}
          </div>
        </div>

        {/* 360 View */}
        <div className="w-2/3 bg-slate-800 border border-slate-700 rounded-xl p-6 text-white min-h-[500px]">
          {!selectedCustomerId ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              Select a customer to view their 360 profile.
            </div>
          ) : loading360 ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              Loading 360 profile...
            </div>
          ) : customer360 ? (
            <div className="space-y-8">
              <div className="flex items-start justify-between border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-2xl font-bold">{customer360.customer.name}</h3>
                  <p className="text-slate-400">{customer360.customer.phone}</p>
                </div>
                <div className="text-right text-sm text-slate-400">
                  <p>{customer360.customer.email}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${customer360.customer.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                  >
                    {customer360.customer.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg border-b border-slate-700 pb-2 mb-4">
                  Properties
                </h4>
                {customer360.customer.properties?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {customer360.customer.properties.map((p: any) => (
                      <div
                        key={p.id}
                        className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50"
                      >
                        <div className="font-bold text-blue-400">{p.propertyNumber}</div>
                        <div className="text-sm text-slate-300">{p.project?.name}</div>
                        <div className="text-xs text-slate-400 mt-2">Value: ₹{p.totalValue}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No properties associated.</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-lg border-b border-slate-700 pb-2 mb-4">
                  Recent Timeline
                </h4>
                <div className="space-y-3">
                  {[
                    ...(customer360.timeline?.auditLogs || []),
                    ...(customer360.timeline?.notifications || []),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt || b.timestamp).getTime() -
                        new Date(a.createdAt || a.timestamp).getTime(),
                    )
                    .slice(0, 5)
                    .map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-700/20 p-3 rounded border border-slate-700/50 text-sm"
                      >
                        <div className="text-xs text-slate-500 mb-1">
                          {new Date(item.createdAt || item.timestamp).toLocaleString()}
                        </div>
                        {item.message ? (
                          <div>
                            <span className="text-emerald-400">[Notification]</span> {item.title}:{' '}
                            {item.message}
                          </div>
                        ) : (
                          <div>
                            <span className="text-blue-400">[Audit: {item.actionType}]</span>{' '}
                            {item.entity}
                          </div>
                        )}
                      </div>
                    ))}
                  {!customer360.timeline?.auditLogs?.length &&
                    !customer360.timeline?.notifications?.length && (
                      <p className="text-slate-500">No recent activity.</p>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500">Failed to load customer details.</div>
          )}
        </div>
      </div>
    </div>
  );
};
