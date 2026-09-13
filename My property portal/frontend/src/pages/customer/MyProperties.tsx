import React, { useEffect, useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

export const MyProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get('/customers/properties');
        setProperties(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  if (loading) return <div className="text-slate-500">Loading your properties...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">My Properties</h2>
        <p className="text-slate-500 mt-1">View and manage your real estate portfolio.</p>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Your properties will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {prop.status}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{prop.project.name}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-4">{prop.project.location}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Property No:</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {prop.propertyNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Type:</span>
                      <span className="text-sm font-semibold text-slate-700">{prop.type}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/customer/properties/${prop.id}`}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
