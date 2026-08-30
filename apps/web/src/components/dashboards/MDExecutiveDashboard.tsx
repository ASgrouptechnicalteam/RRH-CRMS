import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { ExecMetricsData } from '../../types';
import { 
  Users, 
  Award, 
  IndianRupee, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Building,
  ArrowRightLeft
} from 'lucide-react';
import { StatCard, ListWidget, ListItem } from '../ui';
import { UnassignedPropertiesWidget } from '../md/UnassignedPropertiesWidget';

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

  // Compute KPIs
  const totalLeads = execMetrics?.totalLeadsCount || 0;
  const bookings = execMetrics?.totalClosedDeals || 0;
  // Placeholder: salesValue and duePayments not currently fetched in ExecMetricsData or any existing MD route
  const salesValue = "—"; 
  const duePayments = "—"; 

  // Prepare Priority Alerts list items
  const priorityAlerts: ListItem[] = [];
  if (execMetrics?.attendanceExceptionsCount) {
    priorityAlerts.push({
      id: 'att-ex',
      title: `${execMetrics.attendanceExceptionsCount} Attendance Exception${execMetrics.attendanceExceptionsCount === 1 ? '' : 's'}`,
      subtitle: 'Requires HR/Manager review',
      icon: Clock
    });
  }
  if (execMetrics?.pendingVerificationPropertiesCount) {
    priorityAlerts.push({
      id: 'prop-ver',
      title: `${execMetrics.pendingVerificationPropertiesCount} Properties Pending Verification`,
      subtitle: 'Awaiting PM verification',
      icon: Building
    });
  }
  if (execMetrics?.pendingApprovalPropertiesCount) {
    priorityAlerts.push({
      id: 'prop-app',
      title: `${execMetrics.pendingApprovalPropertiesCount} Properties Awaiting Approval`,
      subtitle: 'Requires Executive approval',
      icon: ShieldCheck
    });
  }

  // Placeholder for Distinctive Widget
  const reassignmentEscalations: ListItem[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Good morning, {user?.fullName || user?.employeeCode}. Here's the company overview.</p>
        </div>
      </div>

      {hasError && (
        <div className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-danger-600" />
          Unable to load some executive metrics. Please try again later.
        </div>
      )}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Leads" 
          value={isLoading ? '...' : totalLeads} 
          icon={Users} 
        />
        <StatCard 
          label="Bookings" 
          value={isLoading ? '...' : bookings} 
          icon={Award} 
        />
        <StatCard 
          label="Sales Value" 
          value={isLoading ? '...' : salesValue} 
          icon={IndianRupee} 
        />
        <StatCard 
          label="Due Payments" 
          value={isLoading ? '...' : duePayments} 
          icon={Clock} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Distinctive Widget: Reassignment Escalations */}
          <ListWidget 
            title="Reassignment Escalations"
            items={reassignmentEscalations}
            emptyStateMessage="No escalations pending your review."
          />
          {/* Distinctive Widget: Unassigned Properties Routing */}
          <UnassignedPropertiesWidget />
        </div>

        <div className="space-y-6">
          {/* Priority Alerts */}
          <ListWidget 
            title="Priority Alerts"
            items={priorityAlerts}
            emptyStateMessage="No priority alerts right now."
          />
        </div>
      </div>
    </div>
  );
};
