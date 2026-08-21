import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { ShieldCheck, Users, Building, Clock, FileText, Calendar, TrendingUp, Award, CheckCircle2, Users as UsersIcon, Building as BuildingIcon, IndianRupee } from 'lucide-react';

export const MDExecutiveDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [execMetrics, setExecMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMDData = async () => {
    setIsLoading(true);
    try {
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

  // Helper: format currency/number for display
  const formatNumber = (n: number | null | undefined) =>
    n !== null && n !== undefined ? String(n) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-canvas rounded-xl p-6 border border-neutral-200">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-500" />
          <div>
            <div className="text-navy font-semibold">Good morning, {user?.fullName || user?.employeeCode || 'Executive'}</div>
            <div className="text-sm text-neutral-500">Here's what needs your attention today</div>
          </div>
        </div>
      </div>

      {/* Critical / Priority Alerts */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h3 className="font-semibold text-navy mb-3">Priority Alerts</h3>
        <div className="space-y-3 text-sm text-neutral-600">
          <div>
            <span className="font-medium text-navy">3 leads without follow-up</span>
            <a href="/leads" className="font-medium text-primary hover:underline ml-2">Open Lead</a>
          </div>
          <div>
            <span className="font-medium text-navy">2 site visits today</span>
            <a href="/site-visits" className="font-medium text-primary hover:underline ml-2">View Schedule</a>
          </div>
          <div>
            <span className="font-medium text-navy">4 properties pending approval</span>
            <a href="/properties" className="font-medium text-primary hover:underline ml-2">Review Properties</a>
          </div>
          <div>
            <span className="font-medium text-navy">1 overdue collection</span>
            <a href="/bookings" className="font-medium text-primary hover:underline ml-2">Collections</a>
          </div>
          <div>
            <span className="font-medium text-navy">2 documents awaiting verification</span>
            <a href="/documents" className="font-medium text-primary hover:underline ml-2">Documents</a>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Active Leads</div>
          <div className="text-2xl font-bold text-navy">{formatNumber(execMetrics?.activeLeads)}</div>
          <a href="/leads" className="text-primary/600 hover:underline text-xs mt-2 block">View Leads</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Qualified Leads</div>
          <div className="text-2xl font-bold text-navy">{formatNumber(execMetrics?.qualifiedLeads)}</div>
          <a href="/leads" className="text-primary/600 hover:underline text-xs mt-2 block">View Leads</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Site Visits</div>
          <div className="text-2xl font-bold text-navy">{formatNumber(execMetrics?.siteVisitsToday)}</div>
          <a href="/site-visits" className="text-primary/600 hover:underline text-xs mt-2 block">View Schedule</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Open Deals</div>
          <div className="text-2xl font-bold text-navy">{formatNumber(execMetrics?.openDeals)}</div>
          <a href="/sales-pipeline" className="text-primary/600 hover:underline text-xs mt-2 block">View Pipeline</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Live Properties</div>
          <div className="text-2xl font-bold text-navy">{formatNumber(execMetrics?.liveProperties)}</div>
          <a href="/properties" className="text-primary/600 hover:underline text-xs mt-2 block">View Properties</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Pending Approvals</div>
          <div className="text-2xl font-bold text-navy">{formatNumber(execMetrics?.pendingApprovals)}</div>
          <a href="/properties" className="text-primary/600 hover:underline text-xs mt-2 block">Review Approvals</a>
        </div>
      </div>

      {/* Priority Work / Needs Attention */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h3 className="font-semibold text-navy mb-4">Needs Attention</h3>
        <div className="space-y-3 text-sm text-neutral-600">
          <div>
            <span className="font-medium text-navy">Lead: Ravi Kumar</span>
            <span className="text-xs text-neutral-500 ml-2">Follow-up overdue by 2 days</span>
            <a href="/leads" className="font-medium text-primary hover:underline ml-2">Open Lead</a>
          </div>
          <div>
            <span className="font-medium text-navy">Property: Plot 127</span>
            <span className="text-xs text-neutral-500 ml-2">Pending MD approval</span>
            <a href="/properties" className="font-medium text-primary hover:underline ml-2">Review Property</a>
          </div>
          <div>
            <span className="font-medium text-navy">Booking: RRH-BKG-1027</span>
            <span className="text-xs text-neutral-500 ml-2">Payment pending</span>
            <a href="/bookings" className="font-medium text-primary hover:underline ml-2">Open Transaction</a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h3 className="font-semibold text-navy mb-3">Recent Activity</h3>
        <div className="space-y-3 text-sm text-neutral-600">
          <div>
            <span className="font-medium text-navy">New lead</span>
            <span className="text-[10px] capitalize text-neutral-500">Ravi Kumar added</span>
          </div>
          <div>
            <span className="font-medium text-navy">Status change</span>
            <span className="text-[10px] capitalize text-neutral-500">Property Plot 127 moved to pending approval</span>
          </div>
          <div>
            <span className="font-medium text-navy">Site visit completed</span>
            <span className="text-[10px] capitalize text-neutral-500">101 Main St visited</span>
          </div>
        </div>
      </div>
    </div>
  );
};