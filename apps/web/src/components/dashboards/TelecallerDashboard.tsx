import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Calendar,
  MessageCircle,
  Users,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { LeadListItem } from '../../types';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { TaskManager } from '../tasks/TaskManager';
import { StatCard, ListWidget, StatusPill, ListItem } from '../ui';
import { Button } from '../common/ui/Button';

export const TelecallerDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [assignedLeads, setAssignedLeads] = useState<LeadListItem[]>([]);
  const [targetMetrics, setTargetMetrics] = useState<{ achieved: number; target: number }>({ achieved: 0, target: 25 });
  const [tomorrowVisits, setTomorrowVisits] = useState<ListItem[]>([]);
  const [whatsappFollowUps, setWhatsappFollowUps] = useState(0);
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

      // Fetch site visits for tomorrow
      const svRes = await fetchWithAuth(`${API_BASE_URL}/site-visits`);
      const svData = await svRes.json();
      if (svRes.ok && svData.visits) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const upcomingVisits = svData.visits.filter((v: any) => {
          if (!v.scheduled_date) return false;
          if (v.telecaller_id && v.telecaller_id !== user?.id) return false;
          const visitDate = new Date(v.scheduled_date).toISOString().split('T')[0];
          return visitDate === tomorrowStr && v.status === 'SCHEDULED';
        });

        const listItems: ListItem[] = upcomingVisits.map((v: any) => ({
          id: v.id.toString(),
          title: v.lead?.customer_name || 'Unknown Customer',
          subtitle: `Scheduled for ${new Date(v.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          icon: Calendar,
          meta: 'Reconfirm',
        }));
        
        setTomorrowVisits(listItems);
      }

      // Fetch tasks to determine WhatsApp Follow-ups
      const taskRes = await fetchWithAuth(`${API_BASE_URL}/tasks/my-tasks`);
      const taskData = await taskRes.json();
      if (taskRes.ok && taskData.tasks) {
        const waTasks = taskData.tasks.filter((t: any) => 
          t.title?.toLowerCase().includes('whatsapp') || 
          t.description?.toLowerCase().includes('whatsapp')
        );
        setWhatsappFollowUps(waTasks.length);
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

  // Compute KPIs from existing data
  const leadsAssigned = assignedLeads.length;
  const contactedToday = assignedLeads.filter(l => l.status === 'CONTACTED').length;
  const qualificationPending = assignedLeads.filter(l => l.status === 'NEW' || l.status === 'QUALIFICATION_PENDING').length;

  // Transform active leads for the Distinctive Widget
  // (Site Visits are now fetched above)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Telecaller Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.employeeCode}. Here's your pipeline overview.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Daily Call Target</span>
            <span className="text-sm font-black text-emerald-700">
              {targetMetrics.achieved} / {targetMetrics.target} Calls
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Leads Assigned" 
          value={leadsAssigned} 
          icon={Users} 
        />
        <StatCard 
          label="Contacted Today" 
          value={contactedToday} 
          icon={PhoneCall} 
        />
        <StatCard 
          label="Qualification Pending" 
          value={qualificationPending} 
          icon={Clock} 
        />
        <StatCard 
          label="WhatsApp Follow-ups" 
          value={whatsappFollowUps} 
          icon={MessageCircle} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Priority Call Queue & Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Distinctive Widget: Reconfirm Tomorrow's Visits */}
          {tomorrowVisits.length > 0 && (
            <ListWidget 
              title="Reconfirm Tomorrow's Visits"
              items={tomorrowVisits}
              emptyStateMessage="No visits pending reconfirmation tomorrow."
              viewAllLink="/site-visits"
            />
          )}

          {/* Today's Priority Call Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-navy-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-action" />
                <span>Today's High-Priority Prospects</span>
              </h3>
              <StatusPill status={`${assignedLeads.length} Active`} type="default" />
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading priority prospects...</div>
            ) : assignedLeads.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No prospects currently assigned. Keep your performance score high for priority assignments!
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {assignedLeads.map((lead: LeadListItem) => (
                  <div
                    key={lead.id}
                    className="p-4 bg-surface rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:shadow-sm transition-shadow group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold text-navy-600 text-xs">{lead.lead_code}</span>
                        {lead.status === 'NEW' && <StatusPill status="NEW" type="hot" />}
                        {lead.status === 'CONTACTED' && <StatusPill status="CONTACTED" type="warm" />}
                      </div>
                      <h4 className="font-bold text-navy-900 text-sm">{lead.customer_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lead.phone} • {lead.property_type_preference || 'Villa'}
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 shrink-0 w-full lg:w-auto">
                      <select
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-navy-700 font-semibold text-xs rounded-lg shadow-sm focus:outline-none focus:border-navy-500 transition-colors cursor-pointer"
                        onChange={(e) => {
                          if (e.target.value) {
                            updateLeadStatus(lead.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Update Status...</option>
                        <option value="CONTACTED">Mark Contacted</option>
                        <option value="QUALIFIED">Mark Qualified</option>
                        <option value="SITE_VISIT_SCHEDULED">Schedule Visit</option>
                      </select>

                      <a
                        href={`tel:${lead.phone}`}
                        className="px-3 py-1.5 bg-action hover:bg-navy-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tasks & Score */}
        <div className="space-y-6">
          <PerformanceScoreWidget />
        </div>
      </div>

      {/* Task Manager (Full Width Below) */}
      <div className="mt-6">
        <TaskManager />
      </div>
    </div>
  );
};
