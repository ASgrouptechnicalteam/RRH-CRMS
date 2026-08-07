import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Award,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building,
  Activity,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { PerformanceHistoryTimeline } from '../performance/PerformanceHistoryTimeline';

export const MDExecutiveDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [execMetrics, setExecMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMDData = async () => {
    setIsLoading(true);
    try {
      // Fetch dynamic database metrics
      const res = await fetchWithAuth(`${API_BASE_URL}/md/executive-metrics`);
      const data = await res.json();
      if (res.ok) {
        setExecMetrics(data);
      }
    } catch (e) {
      console.error('Fetch MD executive metrics error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMDData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Executive Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-teal-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-black tracking-tight">Founder & CEO Command Center</h2>
          </div>
          <p className="text-xs text-teal-200/80">
            Real-time executive oversight across lead intake, closed deals, property verification pipeline, and team attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate('/leads')}
            className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 text-center cursor-pointer hover:bg-white/20 transition-colors"
          >
            <span className="text-[10px] uppercase font-bold text-teal-300 block">Total Active Leads</span>
            <span className="text-lg font-black text-white">{execMetrics?.totalLeadsCount ?? '...'} Leads</span>
          </div>

          <div 
            onClick={() => navigate('/site-visits')}
            className="px-4 py-2 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-center cursor-pointer hover:bg-emerald-500/30 transition-colors"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Site Visits Scheduled</span>
            <span className="text-lg font-black text-emerald-400">
              {execMetrics?.siteVisitsScheduled ?? '...'} Visits
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/leads')}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase group-hover:text-teal-700 transition-colors">Total Closed Deals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 group-hover:text-teal-900 transition-colors">
            {execMetrics?.totalClosedDeals ?? '...'} Deals
          </div>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Real-time DB aggregated
          </span>
        </div>

        <div 
          onClick={() => navigate('/leads')}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase group-hover:text-teal-700 transition-colors">Active Lead Intake</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 group-hover:text-teal-900 transition-colors">{execMetrics?.totalLeadsCount ?? 0} Leads</div>
          <span className="text-[10px] text-slate-500 font-semibold">Weighted Auto-Distribution active</span>
        </div>

        <div 
          onClick={() => navigate('/properties')}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase group-hover:text-amber-700 transition-colors">Property Inventory</span>
            <Building className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 group-hover:text-amber-900 transition-colors">{execMetrics?.totalPropertiesCount ?? 0} Properties</div>
          <span className="text-[10px] text-amber-600 font-bold">
            {execMetrics?.livePropertiesCount ?? 0} LIVE • {execMetrics?.pendingApprovalPropertiesCount ?? 0} CEO Approval
          </span>
        </div>

        <div 
          onClick={() => navigate('/employees')}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase group-hover:text-purple-700 transition-colors">Active Team Members</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 group-hover:text-purple-900 transition-colors">{execMetrics?.totalEmployeesCount ?? 0} Employees</div>
          <span className="text-[10px] text-purple-600 font-bold">
            {execMetrics?.attendanceExceptionsCount ?? 0} Attendance Exceptions
          </span>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Lead Conversion Pipeline
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Total Leads', value: execMetrics?.totalLeadsCount || 0 },
                  { name: 'Site Visits', value: execMetrics?.siteVisitsScheduled || 0 },
                  { name: 'Closed Deals', value: execMetrics?.totalClosedDeals || 0 },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-600" />
            Property Status Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            {execMetrics?.totalPropertiesCount === 0 ? (
              <span className="text-sm text-slate-400 font-medium">No properties to display</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Live', value: execMetrics?.livePropertiesCount || 0, color: '#10b981' },
                      { name: 'Pending MD', value: execMetrics?.pendingApprovalPropertiesCount || 0, color: '#f59e0b' },
                      { name: 'Pending PM', value: execMetrics?.pendingVerificationPropertiesCount || 0, color: '#3b82f6' },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {
                      [
                        { name: 'Live', value: execMetrics?.livePropertiesCount || 0, color: '#10b981' },
                        { name: 'Pending MD', value: execMetrics?.pendingApprovalPropertiesCount || 0, color: '#f59e0b' },
                        { name: 'Pending PM', value: execMetrics?.pendingVerificationPropertiesCount || 0, color: '#3b82f6' },
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    }
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Removed Performance Index & Leaderboard as it is not applicable for MD */}
    </div>
  );
};
