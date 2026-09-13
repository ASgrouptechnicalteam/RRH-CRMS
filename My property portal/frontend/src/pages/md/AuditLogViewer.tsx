import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Search,
  ClipboardList,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronRight,
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border border-red-200',
  LOGIN: 'bg-slate-50 text-slate-600 border border-slate-200',
};

function parseJsonSafely(val?: string): Record<string, any> | null {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

function renderValue(val?: string): React.ReactNode {
  if (!val) return null;
  const obj = parseJsonSafely(val);
  if (obj && typeof obj === 'object') {
    return (
      <div className="space-y-1">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <span className="text-slate-400 capitalize min-w-[100px] shrink-0">
              {k.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="text-slate-700 font-medium break-all">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-slate-700 text-xs">{val}</span>;
}

const humanizeEntity = (entity: string) =>
  entity
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();

export const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/audit-logs');
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const entities = [...new Set(logs.map((l) => l.entity))].sort();
  const actions = [...new Set(logs.map((l) => l.actionType))].sort();

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      log.entity.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      log.userId.toLowerCase().includes(q) ||
      (log.reason || '').toLowerCase().includes(q);
    const matchAction = !actionFilter || log.actionType === actionFilter;
    const matchEntity = !entityFilter || log.entity === entityFilter;
    return matchSearch && matchAction && matchEntity;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable record of all critical system actions."
        breadcrumb={['System', 'Audit Logs']}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by entity, action, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">All Actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">All Entities</option>
            {entities.map((e) => (
              <option key={e} value={e}>
                {humanizeEntity(e)}
              </option>
            ))}
          </select>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Audit Trail</h2>
          <span className="text-xs text-slate-400">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading audit trail...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-slate-500 text-sm">{error}</p>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <ClipboardList className="w-8 h-8" />
            <p className="text-sm">No audit logs match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Timestamp', 'Action', 'Entity', 'Details', 'Reason', ''].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(log)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <br />
                      <span className="text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${actionColors[log.actionType] || 'bg-slate-100 text-slate-600'}`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{humanizeEntity(log.entity)}</p>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      {log.newValue && (
                        <div className="text-xs text-slate-600 truncate max-w-[200px]">
                          {parseJsonSafely(log.newValue)
                            ? Object.entries(parseJsonSafely(log.newValue)!)
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(', ')
                            : log.newValue}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{log.reason || '—'}</td>
                    <td className="px-5 py-4">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Audit Entry Details</h3>
                <p className="text-xs text-slate-400">
                  {new Date(selected.timestamp).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-700 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Action</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${actionColors[selected.actionType] || ''}`}
                  >
                    {selected.actionType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Entity</p>
                  <p className="font-semibold text-slate-900">{humanizeEntity(selected.entity)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Actor (User ID)</p>
                  <p className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded">
                    {selected.userId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Entity ID</p>
                  <p className="font-mono text-xs text-slate-500 truncate">{selected.entityId}</p>
                </div>
              </div>
              {selected.reason && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Reason</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                    {selected.reason}
                  </p>
                </div>
              )}
              {selected.oldValue && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Previous State</p>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    {renderValue(selected.oldValue)}
                  </div>
                </div>
              )}
              {selected.newValue && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">New State</p>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    {renderValue(selected.newValue)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
