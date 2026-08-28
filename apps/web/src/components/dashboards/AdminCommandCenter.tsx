import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Database,
  Users,
  Building,
  Target,
  ScrollText,
  RefreshCw,
  Eye,
  ServerCog,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';

/**
 * ADMIN COMMAND CENTER (/dashboard for `Admin (Technical)`)
 *
 * Monitoring & operational overview ONLY — real data from existing backend:
 *   GET /admin/system-metrics   (ADMIN)
 *   GET /admin/audit-logs       (ADMIN)
 *   GET /admin/security-alerts  (ADMIN/MD)
 *
 * High-risk controls (emergency lockdown) intentionally remain in the
 * System Control Center (/system-control → SystemControlHub) to keep a
 * single, clearly-separated destructive surface. No fabricated metrics.
 */

interface SystemMetrics {
  totalLeads?: number;
  totalProperties?: number;
  totalEmployees?: number;
  totalAuditEvents?: number;
  recentErrors?: number;
  databaseStatus?: string;
}

interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  actor_code: string;
  actor_role: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

interface SecurityAlert {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  actor_id: number;
  new_value: string | null;
  created_at: string;
}

/**
 * Maps audit-trail `entity_type` codes to human-readable business nouns so the
 * audit trail reads naturally ("Booking #12", "Site Visit #4" instead of raw
 * internal type codes). Known business objects only — nothing is invented.
 * Unmapped technical codes (e.g. AUTH_FAILED) are shown as-is; this is a
 * Technical Admin surface where technical identifiers remain meaningful.
 */
const ENTITY_LABELS: Record<string, string> = {
  Lead: 'Lead',
  Customer: 'Customer',
  Property: 'Property',
  Project: 'Project',
  Booking: 'Booking',
  Payment: 'Payment',
  Installment: 'Installment',
  Employee: 'Employee',
  Task: 'Task',
  SiteVisit: 'Site Visit',
  Document: 'Document',
  Expense: 'Expense',
  EXPENSE_REFUND: 'Expense Refund',
};

const formatEntityType = (type?: string): string =>
  type ? ENTITY_LABELS[type] ?? 'Record' : 'Record';


export const AdminCommandCenter: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast } = useToast();

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditError, setAuditError] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [alertsError, setAlertsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const fetchTelemetry = useCallback(async () => {
    setIsLoading(true);
    try {
      const [metricsRes, logsRes, alertsRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/admin/system-metrics`),
        fetchWithAuth(`${API_BASE_URL}/admin/audit-logs`),
        fetchWithAuth(`${API_BASE_URL}/admin/security-alerts`),
      ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
        setMetricsError(null);
      } else {
        setMetrics(null);
        setMetricsError(`System metrics unavailable (HTTP ${metricsRes.status})`);
      }

      if (logsRes.ok) {
        const logData = await logsRes.json();
        setAuditLogs(logData.logs || []);
        setAuditError(false);
      } else {
        setAuditLogs([]);
        setAuditError(true);
      }

      if (alertsRes.ok) {
        const alertData = await alertsRes.json();
        setSecurityAlerts(alertData.alerts || []);
        setAlertsError(false);
      } else {
        setSecurityAlerts([]);
        setAlertsError(true);
      }

      setLastRefreshedAt(new Date());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('[AdminCommandCenter] telemetry fetch failed:', e);
      setMetricsError(`Network error: ${message}`);
      showToast('Failed to connect to secure admin endpoints', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  const dbStatus = metrics?.databaseStatus;
  const dbHealthy = dbStatus === 'HEALTHY';

  return (
    <div className="space-y-6">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ServerCog className="w-6 h-6 text-slate-700" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Command Center</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              System health, security, audit activity and operational integrity.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3" /> RESTRICTED ACCESS
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {user?.fullName || user?.employeeCode || 'Technical Admin'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Last refresh: {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* System status — only asserted when the backend reports it */}
            <div
              className={`px-4 py-2 rounded-xl border text-center ${
                isLoading
                  ? 'bg-slate-50 border-slate-200'
                  : dbHealthy
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-500 block">System Status</span>
              <span
                className={`text-sm font-black flex items-center gap-1.5 justify-center ${
                  isLoading ? 'text-slate-400' : dbHealthy ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {!isLoading && (
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      dbHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                )}
                {isLoading ? 'CHECKING…' : dbStatus || 'UNAVAILABLE'}
              </span>
            </div>

            <button
              onClick={fetchTelemetry}
              disabled={isLoading}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !metrics && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-3 text-slate-500">
          <Activity className="w-7 h-7 animate-pulse text-navy-700" />
          <span className="text-sm font-semibold">Connecting to secure admin endpoints…</span>
        </div>
      )}

      {/* ── SYSTEM HEALTH ──────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
          System Health
        </h2>
        {metricsError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs font-semibold text-amber-800 mb-3">
            {metricsError}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {/* Database status card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Database className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wide">Database</span>
            </div>
            <span className={`text-lg font-black ${dbHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
              {dbStatus || 'UNKNOWN'}
            </span>
          </div>
          <MetricCard icon={<Users className="w-4 h-4" />} label="Employee Accounts" value={metrics?.totalEmployees} />
          <MetricCard icon={<Target className="w-4 h-4" />} label="Total Leads" value={metrics?.totalLeads} />
          <MetricCard icon={<Building className="w-4 h-4" />} label="Property Records" value={metrics?.totalProperties} />
          <MetricCard icon={<ScrollText className="w-4 h-4" />} label="Audit Events" value={metrics?.totalAuditEvents} />
        </div>
      </section>

      {/* ── SECURITY / INCIDENTS ───────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
          Security / Incidents
        </h2>
        {alertsError ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
            Security alerts feed is currently unavailable.
          </div>
        ) : securityAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-slate-700">
              System secure — no critical security anomalies detected.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {securityAlerts.slice(0, 8).map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-xl border border-rose-100 shadow-sm p-4 flex items-start gap-3"
              >
                <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-rose-900 break-words">
                    {alert.new_value || alert.action}
                  </div>
                  <div className="text-[11px] font-mono text-rose-500 mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                    {' · '}actor #{alert.actor_id}
                    {alert.entity_type ? ` · ${alert.entity_type} #${alert.entity_id}` : ''}
                  </div>
                </div>
              </div>
            ))}
            {securityAlerts.length > 8 && (
              <p className="text-[11px] text-slate-400 px-1">
                Showing 8 of {securityAlerts.length} alerts.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── AUDIT ACTIVITY ─────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
          Recent Audit Activity
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              Audit Trail
            </h3>
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
              {auditLogs.length} recent events
            </span>
          </div>

          {auditError ? (
            <div className="p-6 text-sm text-slate-500">Audit trail is currently unavailable.</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-6 text-sm text-slate-400 font-mono">No audit events recorded.</div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {auditLogs.slice(0, 30).map((log) => (
                <li key={log.id} className="px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                    <span className="text-[10px] text-slate-400 font-mono sm:w-32 shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold font-mono rounded">
                          {log.action}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {formatEntityType(log.entity_type)}
                          <span className="text-slate-400 font-mono text-[10px]"> #{log.entity_id}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Actor: <strong className="font-mono text-navy-800">{log.actor_code}</strong>{' '}
                        <span className="text-slate-400">({log.actor_role})</span>
                      </div>
                      {(log.old_value || log.new_value) && (
                        <div className="mt-1.5 text-[10px] font-mono bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 inline-block max-w-full overflow-x-auto whitespace-nowrap">
                          {log.old_value && (
                            <span className="text-rose-600 line-through mr-2">{log.old_value}</span>
                          )}
                          {log.new_value && <span className="text-emerald-600">{log.new_value}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── SYSTEM CONTROL SEPARATION ──────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
          High-Security Controls
        </h2>
        <Link
          to="/system-control"
          className="block bg-white hover:bg-rose-50 rounded-2xl border border-rose-200 shadow-sm p-5 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 shrink-0 group-hover:bg-rose-100 transition-colors">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900">System Control Center</h3>
              <p className="text-xs text-slate-500 mt-1">
                High-risk technical controls including emergency lockdown, access-code management and
                deep diagnostics. Destructive operations are confirmation-protected and audited.
              </p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};

/** Metric card — renders only backend-provided values; shows "—" when absent. */
const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value?: number }> = ({
  icon,
  label,
  value,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
    <div className="flex items-center gap-2 text-slate-500 mb-2">
      {icon}
      <span className="text-[11px] font-bold uppercase tracking-wide leading-tight">{label}</span>
    </div>
    <span className="text-lg font-black font-mono text-slate-800">
      {typeof value === 'number' ? value.toLocaleString() : '—'}
    </span>
  </div>
);
