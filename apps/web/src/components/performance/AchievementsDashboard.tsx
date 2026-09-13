import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  Target,
  FileText,
  CheckCircle2,
  Navigation,
  Award,
  Search,
  Users,
  MapPin,
  Handshake,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { Roles, type RoleName } from '../../shared';
import { DataTable } from '../ui/DataTable';

export const AchievementsDashboard: React.FC = () => {
  const { fetchWithAuth, activeRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const isMDOrAdmin = ([Roles.MD, Roles.ADMIN, Roles.MARKETING_DIRECTOR] as string[]).includes(
    activeRole as string,
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['achievements', isMDOrAdmin ? 'ALL' : 'ME'],
    queryFn: async () => {
      const url = isMDOrAdmin
        ? `${API_BASE_URL}/performance/achievements?employeeId=ALL`
        : `${API_BASE_URL}/performance/achievements`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Failed to load achievements');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl">
        Failed to load achievements. Please try again.
      </div>
    );
  }

  const StatCard = ({
    icon: Icon,
    title,
    value,
    colorClass,
  }: {
    icon: any;
    title: string;
    value: number;
    colorClass: string;
  }) => (
    <div
      className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform cursor-default ${colorClass}`}
    >
      <div className="p-4 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  if (isMDOrAdmin && data.leaderboard) {
    const leaderboard = data.leaderboard || [];
    const filteredBoard = leaderboard.filter(
      (emp: any) =>
        (emp.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-24">
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
              <Trophy className="w-8 h-8 text-yellow-200" />
              <h1 className="text-3xl font-extrabold tracking-tight">Company Leaderboard</h1>
            </div>
            <p className="text-amber-100 max-w-2xl text-center md:text-left">
              Tracking the top performers across the entire organization in terms of leads sourced,
              visits executed, and deals closed.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 md:items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-navy-600" />
              Employee Rankings
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
              />
            </div>
          </div>

          <DataTable<any>
            columns={[
              {
                key: 'rank',
                header: 'Rank',
                render: (emp) => {
                  const index = emp.rank - 1;
                  return index === 0 ? (
                    <span className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold shadow-sm">
                      1
                    </span>
                  ) : index === 1 ? (
                    <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold shadow-sm">
                      2
                    </span>
                  ) : index === 2 ? (
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold shadow-sm">
                      3
                    </span>
                  ) : (
                    <span className="w-8 h-8 flex items-center justify-center text-slate-400 font-medium">
                      {index + 1}
                    </span>
                  );
                },
              },
              {
                key: 'full_name',
                header: 'Employee',
                render: (emp) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold">
                      {emp.full_name ? emp.full_name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{emp.full_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 font-mono">{emp.employee_code}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'leadsSourced',
                header: 'Leads Sourced',
                render: (emp) => (
                  <span className="font-semibold text-slate-700">{emp.leadsSourced}</span>
                ),
              },
              {
                key: 'siteVisitsScheduled',
                header: 'Visits Scheduled',
                render: (emp) => (
                  <span className="font-semibold text-slate-700">{emp.siteVisitsScheduled}</span>
                ),
              },
              {
                key: 'siteVisitsExecuted',
                header: 'Visits Executed',
                render: (emp) => (
                  <span className="font-semibold text-slate-700">{emp.siteVisitsExecuted}</span>
                ),
              },
              {
                key: 'assistedConversions',
                header: 'Assisted Conversions',
                render: (emp) => (
                  <span className="font-semibold text-slate-700">{emp.assistedConversions}</span>
                ),
              },
              {
                key: 'dealsClosed',
                header: 'Deals Closed',
                render: (emp) => (
                  <span className="font-bold text-emerald-600 text-lg">{emp.dealsClosed}</span>
                ),
              },
            ]}
            data={filteredBoard.map((emp: any, index: number) => ({ ...emp, rank: index + 1 }))}
            searchable={false}
            emptyMessage="No employees found."
          />
        </div>
      </div>
    );
  }

  // Personal View
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
              <Award className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                My Career Achievements
              </h1>
            </div>
            <p className="text-navy-200 max-w-2xl text-center md:text-left">
              Track your lifetime contributions and milestones. Every lead sourced, visit managed,
              and deal closed brings you closer to the top!
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Trophy}
          title="Deals Closed (Primary)"
          value={data.dealsClosed}
          colorClass="border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 [&>div]:text-emerald-600 [&>div]:bg-emerald-100"
        />
        <StatCard
          icon={Handshake}
          title="Assisted Conversions"
          value={data.assistedConversions}
          colorClass="border-amber-200 bg-amber-50/30 hover:border-amber-300 [&>div]:text-amber-600 [&>div]:bg-amber-100"
        />
        <StatCard
          icon={Target}
          title="Leads Sourced"
          value={data.leadsSourced}
          colorClass="border-blue-200 bg-blue-50/30 hover:border-blue-300 [&>div]:text-blue-600 [&>div]:bg-blue-100"
        />
        <StatCard
          icon={Navigation}
          title="Site Visits Scheduled"
          value={data.siteVisitsScheduled}
          colorClass="border-indigo-200 bg-indigo-50/30 hover:border-indigo-300 [&>div]:text-indigo-600 [&>div]:bg-indigo-100"
        />
        <StatCard
          icon={MapPin}
          title="Site Visits Executed"
          value={data.siteVisitsExecuted}
          colorClass="border-purple-200 bg-purple-50/30 hover:border-purple-300 [&>div]:text-purple-600 [&>div]:bg-purple-100"
        />
      </div>

      {/* Motivational Empty State if completely new */}
      {data.dealsClosed === 0 && data.assistedConversions === 0 && data.leadsSourced === 0 && (
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
            <Trophy className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to make your mark?</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Your achievements board is waiting for you. Start sourcing leads and scheduling site
            visits to see your numbers grow!
          </p>
        </div>
      )}
    </div>
  );
};
