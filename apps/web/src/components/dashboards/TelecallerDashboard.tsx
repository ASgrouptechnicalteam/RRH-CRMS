import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  CheckCircle2,
  Calendar,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  Mic,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { LeadListItem } from '../../types';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { TaskManager } from '../tasks/TaskManager';

export const TelecallerDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [assignedLeads, setAssignedLeads] = useState<LeadListItem[]>([]);
  const [targetMetrics, setTargetMetrics] = useState<{ achieved: number; target: number }>({ achieved: 0, target: 25 });
  const [isLoading, setIsLoading] = useState(true);

  const updateLeadStatus = async (leadId: number, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: 'Updated directly from Daily Calling List' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Prospect status updated successfully!', 'success');
        setAssignedLeads((prev) => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (e) {
      showToast('Error updating status', 'error');
    }
  };

  const fetchTelecallerData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads`);
      const data = await res.json();
      if (res.ok) {
        setAssignedLeads(data.leads || []);
      }

      // Fetch daily target status
      const tgtRes = await fetchWithAuth(`${API_BASE_URL}/targets/my-targets`);
      const tgtData = await tgtRes.json();
      if (tgtRes.ok && tgtData.target) {
        setTargetMetrics({
          achieved: tgtData.target.achieved_value || 0,
          target: tgtData.target.target_value || 25,
        });
      }
    } catch (e) {
      console.error('Fetch telecaller dashboard error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelecallerData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Telecaller Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-navy-950 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-navy-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PhoneCall className="w-5 h-5 text-navy-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Daily Calling List & Prospects</h2>
          </div>
          <p className="text-xs text-navy-200/80">
            Welcome back, <strong className="text-white">{user?.employeeCode}</strong>! Your performance score helps assign priority prospects to you.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate('/leads')}
            className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 text-center cursor-pointer hover:bg-white/20 transition-colors"
          >
            <span className="text-[10px] uppercase font-bold text-navy-300 block">Assigned Prospects</span>
            <span className="text-lg font-black text-white">{assignedLeads.length} Prospects</span>
          </div>

          <div className="px-4 py-2 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Daily Call Target</span>
            <span className="text-lg font-black text-emerald-400">
              {targetMetrics.achieved} / {targetMetrics.target} Calls
            </span>
          </div>
        </div>
      </div>

      {/* Target Gauge & Score Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Today's Priority Call Queue */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-navy-600" />
                <span>Today's High-Priority Prospects</span>
              </h3>
              <span className="text-xs font-mono font-bold text-navy-800 bg-navy-50 px-2.5 py-1 rounded-full border border-navy-200">
                {assignedLeads.length} Active Prospects
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading priority prospects...</div>
            ) : assignedLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No prospects currently assigned. New prospects will be assigned to you based on your performance score!</div>
            ) : (
              <div className="space-y-3">
                {assignedLeads.map((lead: LeadListItem) => (
                  <div
                    key={lead.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy-900 text-xs">{lead.lead_code}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{lead.customer_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{lead.phone} • Prefers: {lead.property_type_preference || 'Villa'}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className="text-[10px] font-bold border border-slate-200 rounded-xl px-2 py-2 bg-white text-slate-700 hover:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all cursor-pointer"
                        title="Update Prospect Status"
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="SITE_VISIT_SCHEDULED">Site Visit Scheduled</option>
                        <option value="NEGOTIATION">In Negotiation</option>
                        <option value="WON">Closed (Won)</option>
                        <option value="LOST">Lost</option>
                      </select>

                      <a
                        href={`tel:${lead.phone}`}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Now</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <TaskManager />
        </div>

        <div>
          <PerformanceScoreWidget />
        </div>
      </div>
    </div>
  );
};
