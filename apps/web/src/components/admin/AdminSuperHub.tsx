import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { ShieldCheck, ScrollText, ShieldAlert, Users, Lock, Eye } from 'lucide-react';
import { ListWidget, ListItem } from '../ui';
import { RoleChangePage } from './RoleChangePage';

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
  new_value?: string;
  created_at: string;
}

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

export const AdminSuperHub: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<'roles' | 'audit' | 'security'>('roles');
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditError, setAuditError] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [alertsError, setAlertsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logsRes, alertsRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/admin/audit-logs`),
        fetchWithAuth(`${API_BASE_URL}/admin/security-alerts`),
      ]);

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
    } catch (e: unknown) {
      console.error('[AdminSuperHub] fetch failed:', e);
      showError({ message: 'Failed to connect to secure admin endpoints' });
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, showError]);

  useEffect(() => {
    if (activeTab === 'audit' || activeTab === 'security') {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  const securityItems: ListItem[] = securityAlerts.map(alert => ({
    id: alert.id,
    title: alert.new_value || alert.action,
    subtitle: `${new Date(alert.created_at).toLocaleString()} · Actor #${alert.actor_id} ${alert.entity_type ? `· ${alert.entity_type} #${alert.entity_id}` : ''}`,
    icon: ShieldAlert,
  }));

  const auditItems: ListItem[] = auditLogs.map(log => ({
    id: log.id,
    title: `${log.action} ${formatEntityType(log.entity_type)} #${log.entity_id}`,
    subtitle: `Actor: ${log.actor_code} (${log.actor_role}) · ${new Date(log.created_at).toLocaleString()}`,
    meta: (log.old_value || log.new_value) ? (
      <div className="text-[10px] font-mono bg-slate-50 border border-slate-100 rounded px-1 max-w-[150px] truncate text-slate-500">
        {log.old_value && <span className="line-through mr-1">{log.old_value}</span>}
        {log.new_value && <span>{log.new_value}</span>}
      </div>
    ) : undefined,
    icon: Eye
  }));

  return (
    <div className="space-y-6">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-navy-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl font-extrabold tracking-tight">Super Admin Hub</h1>
          </div>
          <p className="text-xs text-navy-200/80">
            Exclusive Technical Admin Portal for Roles, Audit Trails, and Security Logs.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar gap-1 p-2 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'roles' 
                ? 'bg-white text-navy-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            Role Assignment
          </button>
          
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'audit' 
                ? 'bg-white text-navy-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            Audit Reviews
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'security' 
                ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-200' 
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Security / Incidents
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 bg-slate-50 min-h-[600px]">
          {activeTab === 'roles' && (
            <div className="max-w-7xl mx-auto">
              <RoleChangePage />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
               <ListWidget
                  title="System Audit Activity"
                  items={auditError ? [] : auditItems}
                  emptyStateMessage={auditError ? 'Audit trail is currently unavailable.' : 'No audit events recorded.'}
               />
            </div>
          )}

          {activeTab === 'security' && (
             <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
               <ListWidget
                  title="Security & Anomalies"
                  items={alertsError ? [] : securityItems}
                  emptyStateMessage={alertsError ? 'Security alerts feed unavailable.' : 'System secure — no critical security anomalies detected.'}
               />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
