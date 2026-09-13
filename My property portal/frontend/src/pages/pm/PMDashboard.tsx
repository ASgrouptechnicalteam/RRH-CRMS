import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { Building2, Home, CheckCircle2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const PMDashboard = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/pm/dashboard');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching PM dashboard', error);
      }
    };
    fetchData();
  }, []);

  if (!data) return <div className="text-white p-8">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Project Manager Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Assigned Projects</p>
              <h3 className="text-3xl font-bold text-white mt-2">{data.assignedProjects}</h3>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <Building2 size={24} />
            </div>
          </div>
        </div>

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
              <p className="text-slate-400 text-sm font-medium">Sold / Registered</p>
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
        <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
        <Link
          to="/pm/projects"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          View Assigned Projects
        </Link>
      </div>
    </div>
  );
};

export default PMDashboard;
