import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { ShieldCheck, TrendingUp, DollarSign } from 'lucide-react';

interface DashboardData {
  totalEarned: number;
  pendingAmount: number;
  leadConversionRate: number;
  upcomingApprovals: number;
}

export const MDAnalyticsDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/md/dashboard`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('MD Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-slate-600">Loading MD dashboard…</div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-red-600">Failed to load MD metrics.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center">
        <ShieldCheck className="w-6 h-6 text-teal-600 mr-3" />
        <div>
          <div className="text-sm text-slate-500">Total Earned</div>
          <div className="text-xl font-bold text-teal-800">₹{data.totalEarned.toLocaleString()}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center">
        <DollarSign className="w-6 h-6 text-amber-600 mr-3" />
        <div>
          <div className="text-sm text-slate-500">Pending Payouts</div>
          <div className="text-xl font-bold text-amber-800">₹{data.pendingAmount.toLocaleString()}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center">
        <TrendingUp className="w-6 h-6 text-green-600 mr-3" />
        <div>
          <div className="text-sm text-slate-500">Lead Conversion</div>
          <div className="text-xl font-bold text-green-800">{data.leadConversionRate}%</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center">
        <ShieldCheck className="w-6 h-6 text-indigo-600 mr-3" />
        <div>
          <div className="text-sm text-slate-500">Approvals Awaiting</div>
          <div className="text-xl font-bold text-indigo-800">{data.upcomingApprovals}</div>
        </div>
      </div>
    </div>
  );
};
