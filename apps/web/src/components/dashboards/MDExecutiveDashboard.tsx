import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { ExecMetricsData } from '../../types';
import { ShieldCheck, Users, Building, Clock, FileText, Calendar, TrendingUp, Award, CheckCircle2, Users as UsersIcon, Building as BuildingIcon, IndianRupee } from 'lucide-react';

export const MDExecutiveDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [execMetrics, setExecMetrics] = useState<ExecMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchMDData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/md/executive-metrics`);
      const data = await res.json();
      if (res.ok) {
        setExecMetrics(data);
      } else {
        setHasError(true);
      }
    } catch (e) {
      console.error('Fetch MD executive metrics error:', e);
      setHasError(true);
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

      {/* Critical / Priority Alerts — derived from live executive metrics (no fabricated data) */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h3 className="font-semibold text-navy mb-3">Priority Alerts</h3>
        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className="h-4 w-2/3 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-neutral-100 rounded animate-pulse" />
          </div>
        ) : hasError ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Unable to load executive metrics. Please try again later.
          </div>
        ) : (
          <div className="space-y-3 text-sm text-neutral-600">
            {(execMetrics?.attendanceExceptionsCount ?? 0) > 0 && (
              <div>
                <span className="font-medium text-navy">{execMetrics?.attendanceExceptionsCount} attendance exception{execMetrics?.attendanceExceptionsCount === 1 ? '' : 's'} today</span>
                <a href="/hr-hub" className="font-medium text-primary hover:underline ml-2">Review Attendance</a>
              </div>
            )}
            {(execMetrics?.pendingVerificationPropertiesCount ?? 0) > 0 && (
              <div>
                <span className="font-medium text-navy">{execMetrics?.pendingVerificationPropertiesCount} propert{execMetrics?.pendingVerificationPropertiesCount === 1 ? 'y' : 'ies'} pending verification</span>
                <a href="/properties" className="font-medium text-primary hover:underline ml-2">Review Properties</a>
              </div>
            )}
            {(execMetrics?.pendingApprovalPropertiesCount ?? 0) > 0 && (
              <div>
                <span className="font-medium text-navy">{execMetrics?.pendingApprovalPropertiesCount} propert{execMetrics?.pendingApprovalPropertiesCount === 1 ? 'y' : 'ies'} awaiting approval</span>
                <a href="/properties" className="font-medium text-primary hover:underline ml-2">Review Approvals</a>
              </div>
            )}
            {(execMetrics?.attendanceExceptionsCount ?? 0) === 0 &&
              (execMetrics?.pendingVerificationPropertiesCount ?? 0) === 0 &&
              (execMetrics?.pendingApprovalPropertiesCount ?? 0) === 0 && (
                <div className="text-sm text-neutral-500">No priority alerts right now.</div>
              )}
          </div>
        )}
      </div>

      {/* KPI Strip — bound to /md/executive-metrics contract */}
      <div data-tour="dashboard-kpis" className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Total Leads</div>
          <div className="text-2xl font-bold text-navy">{isLoading ? '…' : formatNumber(execMetrics?.totalLeadsCount)}</div>
          <a href="/leads" className="text-primary/600 hover:underline text-xs mt-2 block">View Leads</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Closed Deals</div>
          <div className="text-2xl font-bold text-navy">{isLoading ? '…' : formatNumber(execMetrics?.totalClosedDeals)}</div>
          <a href="/leads" className="text-primary/600 hover:underline text-xs mt-2 block">View Leads</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Site Visits Scheduled</div>
          <div className="text-2xl font-bold text-navy">{isLoading ? '…' : formatNumber(execMetrics?.siteVisitsScheduled)}</div>
          <a href="/site-visits" className="text-primary/600 hover:underline text-xs mt-2 block">View Schedule</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Live Properties</div>
          <div className="text-2xl font-bold text-navy">{isLoading ? '…' : formatNumber(execMetrics?.livePropertiesCount)}</div>
          <a href="/properties" className="text-primary/600 hover:underline text-xs mt-2 block">View Properties</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Pending Verification</div>
          <div className="text-2xl font-bold text-navy">{isLoading ? '…' : formatNumber(execMetrics?.pendingVerificationPropertiesCount)}</div>
          <a href="/properties" className="text-primary/600 hover:underline text-xs mt-2 block">Review Verifications</a>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Pending Approvals</div>
          <div className="text-2xl font-bold text-navy">{isLoading ? '…' : formatNumber(execMetrics?.pendingApprovalPropertiesCount)}</div>
          <a href="/properties" className="text-primary/600 hover:underline text-xs mt-2 block">Review Approvals</a>
        </div>
      </div>

    </div>
  );
};
