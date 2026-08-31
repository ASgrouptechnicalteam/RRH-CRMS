import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, CalendarCheck, ShieldAlert, TrendingUp, FileText, Briefcase, Award, Calendar 
} from 'lucide-react';
import { EmployeeManagement } from '../employees/EmployeeManagement';
import { HolidayManagement } from './HolidayManagement';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Roles } from '../../shared';
import { API_BASE_URL } from '../../config';
import { DataTable, ColumnDef } from '../ui/DataTable';
import { StatCard } from '../ui/StatCard';
import { TeamPerformanceRow } from '../../types';

const TeamPerformanceTab: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [performanceData, setPerformanceData] = useState<TeamPerformanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/analytics/sales-manager`);
        const data = await res.json();
        if (res.ok && data.teamPerformance) {
          setPerformanceData(data.teamPerformance);
        }
      } catch (err) {
        console.error('Failed to load performance analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const columns: ColumnDef<TeamPerformanceRow>[] = [
    {
      key: 'employee',
      header: 'Salesperson',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-xs shrink-0">
            {r.employee.employee_code?.slice(-3) || '???'}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">{r.employee.full_name || 'Unknown'}</div>
            <div className="text-[10px] text-slate-400 font-mono">{r.employee.employee_code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'assignedLeads',
      header: 'Total Assigned',
      sortable: true,
      render: (r) => <span className="font-bold text-slate-700">{r.assignedLeads}</span>
    },
    {
      key: 'contacted',
      header: 'Contacted',
      sortable: true,
      render: (r) => <span className="font-bold text-navy-600">{r.contacted}</span>
    },
    {
      key: 'qualified',
      header: 'Qualified',
      sortable: true,
      render: (r) => <span className="font-bold text-gold-600">{r.qualified}</span>
    },
    {
      key: 'won',
      header: 'Booked (Won)',
      sortable: true,
      render: (r) => <span className="font-bold text-success-600">{r.won}</span>
    },
    {
      key: 'conversionRate',
      header: 'Conversion %',
      sortable: true,
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${r.conversionRate >= 10 ? 'bg-success-100 text-success-800' : 'bg-slate-100 text-slate-700'}`}>
          {r.conversionRate.toFixed(1)}%
        </span>
      )
    }
  ];

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500">Loading performance data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div>
          <h3 className="font-bold text-navy-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-500" />
            CRM Pipeline Conversion Metrics
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Track individual salesperson efficiency from lead assignment to final booking.
          </p>
        </div>
      </div>
      <div className="max-h-72 md:max-h-96 overflow-y-auto overscroll-contain pr-1">
        <DataTable 
          columns={columns}
          data={performanceData}
          searchable={true}
          emptyMessage="No performance data found."
        />
      </div>
    </div>
  );
};

export const HRDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DIRECTORY' | 'HOLIDAYS' | 'PERFORMANCE' | 'DOCUMENTS'>((searchParams.get('tab') as any) || 'DIRECTORY');

  const canManageEmployees = user?.roles?.some(
    (r) => [Roles.MD, Roles.HR_MANAGER, Roles.ADMIN, Roles.MARKETING_DIRECTOR].includes(r as never)
  );

  if (!canManageEmployees) {
    return <Navigate to="/" replace />;
  }

  const [hrMetrics, setHrMetrics] = useState({
    headcount: 0,
    leavesToday: 0,
    avgConversion: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab !== 'OVERVIEW') return;

    const fetchHrMetrics = async () => {
      setMetricsLoading(true);
      try {
        const [employeesRes, perfRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/employees`),
          fetchWithAuth(`${API_BASE_URL}/analytics/sales-manager`),
          // Could fetch attendance or leave proposals if endpoint available.
          // Defaulting leaves to 0 as requested if no explicit endpoint.
        ]);

        let totalHeadcount = 0;
        let activeLeaves = 0; // Or could be derived from employee status if available
        if (employeesRes.ok) {
          const empData = await employeesRes.json();
          const employees = empData.employees || empData;
          totalHeadcount = Array.isArray(employees) ? employees.filter((e: any) => e.status === 'ACTIVE').length : 0;
          activeLeaves = Array.isArray(employees) ? employees.filter((e: any) => e.status === 'ON_LEAVE').length : 0;
        }

        let avgConversion = 0;
        if (perfRes.ok) {
          const perfData = await perfRes.json();
          if (perfData.teamPerformance && perfData.teamPerformance.length > 0) {
            const sum = perfData.teamPerformance.reduce((acc: number, row: any) => acc + (row.conversionRate || 0), 0);
            avgConversion = sum / perfData.teamPerformance.length;
          }
        }

        setHrMetrics({
          headcount: totalHeadcount,
          leavesToday: activeLeaves, // Uses ON_LEAVE status or defaults to 0
          avgConversion: avgConversion
        });
      } catch (err) {
        console.error('Failed to load HR metrics', err);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchHrMetrics();
  }, [activeTab, fetchWithAuth]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-navy-700/30">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-gold-500" />
          <h1 className="text-2xl font-extrabold tracking-tight">HR & Team Management</h1>
        </div>
        <p className="text-sm text-navy-200/80 max-w-2xl">
          Manage the organizational directory, approve leave requests, track daily attendance, and correlate CRM performance to personnel.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Briefcase },
          { id: 'DIRECTORY', label: 'Directory', icon: Users },
          { id: 'HOLIDAYS', label: 'Holidays', icon: Calendar },
          { id: 'PERFORMANCE', label: 'CRM Performance', icon: TrendingUp },
          { id: 'DOCUMENTS', label: 'Onboarding / Docs', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSearchParams({ tab: tab.id });
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === tab.id
                ? 'bg-navy-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-navy-700'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-gold-400' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-bold text-slate-800 text-lg">Department Snapshot</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Active Headcount" value={metricsLoading ? "..." : hrMetrics.headcount.toString()} icon={Users} trend={{ direction: 'up', value: '3', label: 'New this month' }} />
              <StatCard label="On Leave Today" value={metricsLoading ? "..." : hrMetrics.leavesToday.toString()} icon={ShieldAlert} trend={{ direction: 'down', value: '1', label: 'Unplanned absence' }} />
              <StatCard label="Avg Pipeline Conversion" value={metricsLoading ? "..." : `${hrMetrics.avgConversion.toFixed(1)}%`} icon={TrendingUp} trend={{ direction: 'up', value: '2.1%', label: 'vs last month' }} />
            </div>
            <div className="bg-surface border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <p className="text-sm font-semibold mb-2">Extended HR Analytics arriving in a future update.</p>
              <p className="text-xs">Navigate to the Directory, Attendance, or Performance tabs for actionable data.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'DIRECTORY' && (
          <div className="animate-fadeIn">
            <EmployeeManagement />
          </div>
        )}
        
        {activeTab === 'HOLIDAYS' && (
          <div className="animate-fadeIn">
            <HolidayManagement />
          </div>
        )}
        
        {activeTab === 'PERFORMANCE' && (
          <div className="animate-fadeIn">
            <TeamPerformanceTab />
          </div>
        )}
        
        {activeTab === 'DOCUMENTS' && (
          <div className="bg-surface border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center animate-fadeIn min-h-[300px]">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700 text-lg mb-2">Employee Document Vault</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Secure onboarding documents, contracts, and ID proofs storage will be available in the upcoming Document Management Phase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
