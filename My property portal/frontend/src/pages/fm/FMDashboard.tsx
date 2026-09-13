import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { Home, CheckCircle2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const FMDashboard = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/fm/dashboard');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching FM dashboard', error);
      }
    };
    fetchData();
  }, []);

  if (!data) return <div className="text-white p-8">Loading dashboard...</div>;

  if (!data.assignedProject) {
    return (
      <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700 mt-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">No Project Assigned</h2>
        <p className="text-slate-400">
          You currently are not assigned to manage any active project. Please contact MD to assign a
          project to you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Field Manager Dashboard</h2>
      <p className="text-slate-400">
        Assigned Project:{' '}
        <span className="font-semibold text-white">{data.assignedProject.name}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Properties</p>
              <h3 className="text-3xl font-bold text-white mt-2">{data.totalProperties}</h3>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Home size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Available Units</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-2">
                {data.statusBreakdown?.available || 0}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Sold</p>
              <h3 className="text-3xl font-bold text-blue-400 mt-2">
                {data.statusBreakdown?.sold || 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Operations</h3>
        <Link
          to="/fm/property-updates"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          Log Property Update
        </Link>
      </div>
    </div>
  );
};

export default FMDashboard;
