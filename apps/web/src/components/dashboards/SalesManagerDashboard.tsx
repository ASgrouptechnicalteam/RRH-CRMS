import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import {
  TrendingUp, Users, Target, Activity, AlertCircle, Calendar,
  CheckCircle, Clock, ShieldAlert, Award, PhoneCall
} from 'lucide-react';
import { SalesManagerDashboardData, PipelineStageCount, TeamPerformanceRow, LeadAttributionRow, StalledLeadRow, OverdueTaskRow } from '../../types';

export const SalesManagerDashboard: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [data, setData] = useState<SalesManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/analytics/sales-manager`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load Sales Manager dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchWithAuth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-navy-700">
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <div className="text-red-500">Failed to load dashboard data.</div>;

  const { kpis, pipeline, teamPerformance, leadAttribution, stalledLeads, overdueTasks, siteVisits, targets } = data;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-navy via-slate-900 to-navy-950 p-6 rounded-3xl text-white shadow-xl">
        <h1 className="text-2xl font-black mb-2">Sales Manager Command Center</h1>
        <p className="text-sm text-navy-100 opacity-90">
          Monitor team pipeline execution and lead attribution credit.
        </p>
      </div>

      {/* KPI Strip */}
      <div data-tour="dashboard-kpis" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={kpis.totalLeads} icon={<Users className="w-5 h-5" />} />
        <KpiCard label="New Leads" value={kpis.newLeads} icon={<Activity className="w-5 h-5" />} color="bg-navy-50 text-navy-700" />
        <KpiCard label="Unassigned" value={kpis.unassignedLeads} icon={<AlertCircle className="w-5 h-5" />} color="bg-orange-50 text-orange-700" />
        <KpiCard label="Contacted" value={kpis.contacted} icon={<PhoneCall className="w-5 h-5" />} />
        <KpiCard label="Qualified" value={kpis.qualified} icon={<CheckCircle className="w-5 h-5" />} color="bg-emerald-50 text-emerald-700" />
        <KpiCard label="Site Visits" value={kpis.siteVisits} icon={<Calendar className="w-5 h-5" />} color="bg-purple-50 text-purple-700" />
        <KpiCard label="Won" value={kpis.won} icon={<Award className="w-5 h-5" />} color="bg-navy-50 text-navy-700" />
        <KpiCard label="Conversion" value={`${kpis.conversionRate.toFixed(1)}%`} icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline Graph */}
          <div data-tour="dashboard-pipeline" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-800 mb-4">Pipeline Distribution</h3>
            <div className="space-y-3">
              {pipeline.map((p: PipelineStageCount) => {
                const max = Math.max(...pipeline.map((x: PipelineStageCount) => x.count), 1);
                const percent = (p.count / max) * 100;
                return (
                  <div key={p.status} className="flex items-center gap-3">
                    <span className="w-32 text-xs font-bold text-slate-600 truncate">{p.status}</span>
                    <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-navy-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-bold text-slate-800">{p.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Performance */}
          <div data-tour="dashboard-team-performance" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-navy-600" />
                Team Performance
              </h3>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Operational — Based on Assigned Leads</span>
            </div>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="py-2 font-bold">Employee</th>
                  <th className="py-2 font-bold text-right">Assigned</th>
                  <th className="py-2 font-bold text-right">Contacted</th>
                  <th className="py-2 font-bold text-right">Qualified</th>
                  <th className="py-2 font-bold text-right">Won</th>
                  <th className="py-2 font-bold text-right">Conv. %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamPerformance.map((tp: TeamPerformanceRow) => (
                  <tr key={tp.employee.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-800">{tp.employee.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{tp.employee.employee_code}</div>
                    </td>
                    <td className="py-3 text-right font-medium">{tp.assignedLeads}</td>
                    <td className="py-3 text-right font-medium">{tp.contacted}</td>
                    <td className="py-3 text-right font-medium">{tp.qualified}</td>
                    <td className="py-3 text-right font-bold text-navy-600">{tp.won}</td>
                    <td className="py-3 text-right font-mono text-xs">{tp.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))}
                {teamPerformance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400 text-xs">No team performance data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Lead Attribution */}
          <div data-tour="dashboard-lead-attribution" className="bg-navy-50/50 p-5 rounded-3xl border border-navy-100 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-navy-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-navy-600" />
                Top Lead Introducers
              </h3>
              <span className="px-2.5 py-1 bg-navy-100 text-navy-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Attribution Credit — Original Introduction</span>
            </div>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-navy-200/50 text-navy-700/70">
                  <th className="py-2 font-bold">Introduced By</th>
                  <th className="py-2 font-bold text-right">Introduced</th>
                  <th className="py-2 font-bold text-right">Qualified</th>
                  <th className="py-2 font-bold text-right">Won</th>
                  <th className="py-2 font-bold text-right">Conv. %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100/50">
                {leadAttribution.map((la: LeadAttributionRow) => (
                  <tr key={la.employee.id} className="hover:bg-navy-50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-navy-900">{la.employee.full_name}</div>
                      <div className="text-xs text-navy-500 font-mono">{la.employee.employee_code}</div>
                    </td>
                    <td className="py-3 text-right font-bold text-navy-700">{la.leadsIntroduced}</td>
                    <td className="py-3 text-right font-medium text-navy-800">{la.qualified}</td>
                    <td className="py-3 text-right font-bold text-emerald-600">{la.won}</td>
                    <td className="py-3 text-right font-mono text-xs text-navy-600">{la.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))}
                {leadAttribution.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-navy-400 text-xs">No attribution data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Targets */}
          <div data-tour="dashboard-targets" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-500" />
              Target vs Actual
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-700">
                <span>Revenue Target</span>
                <span>{targets.targetAttainmentPercentage?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${targets.targetAttainmentPercentage >= 100 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                  style={{ width: `${Math.min(targets.targetAttainmentPercentage || 0, 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Site Visits */}
          <div data-tour="dashboard-site-visits" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-navy-600" />
              Site Visits
            </h3>
            <div className="space-y-3">
              {Object.entries(siteVisits).map(([status, count]: [string, number]) => (
                <div key={status} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-600 capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">{count}</span>
                </div>
              ))}
              {Object.keys(siteVisits).length === 0 && (
                <div className="text-xs text-slate-400 text-center py-2">No site visits recorded.</div>
              )}
            </div>
          </div>

          {/* Stalled Leads */}
          <div data-tour="dashboard-stalled-leads" className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100 shadow-sm">
            <h3 className="font-extrabold text-rose-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Stalled Leads ({'>'}7 Days)
            </h3>
            <div className="space-y-3">
              {stalledLeads.map((l: StalledLeadRow) => (
                <div key={l.id} className="text-sm bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                  <div className="font-bold text-slate-800">Lead #{l.id}</div>
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>{l.assigned_to?.full_name || 'Unassigned'}</span>
                    <span className="text-rose-600 font-bold">{new Date(l.last_contacted_at || l.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {stalledLeads.length === 0 && (
                <div className="text-xs text-rose-400/80 text-center py-2 font-medium">No stalled leads. Good job!</div>
              )}
            </div>
          </div>

          {/* Overdue Tasks */}
          <div data-tour="dashboard-overdue-tasks" className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100 shadow-sm">
            <h3 className="font-extrabold text-orange-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Overdue Follow-ups
            </h3>
            <div className="space-y-3">
              {overdueTasks.map((t: OverdueTaskRow) => (
                <div key={t.id} className="text-sm bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
                  <div className="font-bold text-slate-800">{t.lead?.customer_name || 'No Lead'}</div>
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>{t.assignee?.full_name}</span>
                    <span className="text-orange-600 font-bold">{new Date(t.target_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {overdueTasks.length === 0 && (
                <div className="text-xs text-orange-400/80 text-center py-2 font-medium">No overdue tasks.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ label, value, icon, color = "bg-slate-100 text-slate-700" }) => (
  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className={`p-1.5 rounded-xl ${color}`}>{icon}</div>
    </div>
    <div className="text-2xl font-black text-slate-800">{value}</div>
  </div>
);
