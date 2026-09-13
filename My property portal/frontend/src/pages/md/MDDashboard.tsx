import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Building2,
  Home,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

const FinancialBar = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-semibold text-slate-900">{formatINR(value)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const MDDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/md/dashboard')
      .then((r) => setMetrics(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading dashboard...</span>
      </div>
    );
  }
  if (error || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-500">
        <XCircle className="w-8 h-8 text-red-400" />
        <p>{error || 'No data available'}</p>
      </div>
    );
  }

  const total = metrics.financial.expected || 1;
  const collectionRate = metrics.financial.collectionRate;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here's your organizational overview for today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={metrics.customers.total}
          subtext={`${metrics.customers.active} active`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={metrics.projects.active}
          subtext={`${metrics.projects.total} total`}
          icon={Building2}
          color="indigo"
        />
        <StatCard
          title="Properties"
          value={metrics.properties.available + metrics.properties.booked + metrics.properties.sold}
          subtext={`${metrics.properties.available} available`}
          icon={Home}
          color="purple"
        />
        <StatCard
          title="Collection Rate"
          value={`${collectionRate}%`}
          subtext="of expected EMI"
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Financial Overview + Property Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Financial Overview</h3>
          <p className="text-xs text-slate-400 mb-5">EMI collection status across all customers</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium mb-1">Expected</p>
              <p className="text-lg font-bold text-slate-900">
                {formatINR(metrics.financial.expected)}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-emerald-600 font-medium mb-1">Collected</p>
              <p className="text-lg font-bold text-emerald-700">
                {formatINR(metrics.financial.collected)}
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-amber-600 font-medium mb-1">Pending</p>
              <p className="text-lg font-bold text-amber-700">
                {formatINR(metrics.financial.pending)}
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-600 font-medium mb-1">Late</p>
              <p className="text-lg font-bold text-red-700">{formatINR(metrics.financial.late)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <FinancialBar
              label="Collected"
              value={metrics.financial.collected}
              total={total}
              color="bg-emerald-500"
            />
            <FinancialBar
              label="Pending"
              value={metrics.financial.pending}
              total={total}
              color="bg-amber-400"
            />
            <FinancialBar
              label="Late"
              value={metrics.financial.late}
              total={total}
              color="bg-red-400"
            />
          </div>
        </div>

        {/* Property Overview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Property Inventory</h3>
          <p className="text-xs text-slate-400 mb-5">Status breakdown across all projects</p>

          <div className="space-y-3">
            {[
              {
                label: 'Available',
                value: metrics.properties.available,
                color: 'bg-emerald-500',
                textColor: 'text-emerald-700',
                bg: 'bg-emerald-50',
              },
              {
                label: 'Booked',
                value: metrics.properties.booked,
                color: 'bg-blue-500',
                textColor: 'text-blue-700',
                bg: 'bg-blue-50',
              },
              {
                label: 'Sold',
                value: metrics.properties.sold,
                color: 'bg-purple-500',
                textColor: 'text-purple-700',
                bg: 'bg-purple-50',
              },
            ].map((item) => {
              const propTotal =
                (metrics.properties.available || 0) +
                  (metrics.properties.booked || 0) +
                  (metrics.properties.sold || 0) || 1;
              const pct = Math.min(100, (item.value / propTotal) * 100);
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-4 p-3.5 rounded-xl ${item.bg}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 border border-white shadow-sm`}
                  >
                    <Home className={`w-5 h-5 ${item.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={`font-semibold ${item.textColor}`}>{item.label}</span>
                      <span className={`font-bold ${item.textColor}`}>{item.value} units</span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customer Demographics */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Customer Demographics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: metrics.customers.total, icon: Users, color: 'blue' as const },
            {
              label: 'Active',
              value: metrics.customers.active,
              icon: CheckCircle2,
              color: 'green' as const,
            },
            {
              label: 'New (30d)',
              value: metrics.customers.new,
              icon: TrendingUp,
              color: 'indigo' as const,
            },
            {
              label: 'Multi-Property',
              value: metrics.customers.multipleProperty,
              icon: Home,
              color: 'purple' as const,
            },
          ].map((c) => (
            <StatCard key={c.label} title={c.label} value={c.value} icon={c.icon} color={c.color} />
          ))}
        </div>
      </div>
    </div>
  );
};
