import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Upload,
  TrendingUp,
  ShieldCheck,
  PhoneCall,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { Roles, Permissions } from '@rrh-ems/shared';
import { QuickAddLeadModal } from './QuickAddLeadModal';
import { LeadDetailModal } from './LeadDetailModal';
import {
  MonitorData,
  EmployeeListItem,
  ParsedBulkLeadRow,
} from '../../types';
import { DataTable, ColumnDef } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import { StatCard } from '../ui/StatCard';

interface Lead {
  id: number;
  lead_code: string;
  customer_name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  assignment_type?: string;
  property_type_preference?: string;
  preferred_location?: string;
  budget_min?: number;
  budget_max?: number;
  assigned_to?: { id: number; employee_code: string; full_name: string; phone: string };
  created_by?: { id: number; employee_code: string; full_name: string };
  created_at: string;
  activities?: any[];
  lead_score?: number;
  sla_breach_at?: string | null;
  campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referral_person_name?: string | null;
}

export const LeadManagement: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);

  const fetchEmployees = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/md/employees`);
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error('Failed to load employees for lead assignment');
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [parsedBulkLeads, setParsedBulkLeads] = useState<ParsedBulkLeadRow[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const isOperatorOrAdmin = user?.roles.some((r: string) =>
    [Roles.DIGITAL_LEAD_OPERATOR, Roles.MARKETING_DIRECTOR, Roles.MD, Roles.ADMIN].includes(r as never)
  );

  const handleBulkUploadBtnClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        showToast('Selected file is empty', 'error');
        return;
      }

      const parsedRows: ParsedBulkLeadRow[] = [];
      const startIdx = lines[0].toLowerCase().includes('phone') || lines[0].toLowerCase().includes('name') ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2 && parts[0] && parts[1]) {
          parsedRows.push({
            customer_name: parts[0],
            phone: parts[1],
            email: parts[2] || '',
            property_type: parts[3] || 'RESIDENTIAL_VILLA',
            location: parts[4] || 'Miyapur',
            notes: parts[5] || 'Imported via Bulk CSV Upload',
          });
        }
      }

      if (parsedRows.length === 0) {
        showToast('No valid lead rows found in CSV. Format: Name, Phone, Email, PropertyType, Location, Notes', 'error');
        return;
      }

      setParsedBulkLeads(parsedRows);
      setShowBulkModal(true);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmBulkUpload = async () => {
    if (parsedBulkLeads.length === 0) return;
    setIsBulkUploading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: parsedBulkLeads }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Successfully uploaded and auto-distributed ${data.count} leads!`, 'success');
        setShowBulkModal(false);
        setParsedBulkLeads([]);
        fetchLeads();
      } else {
        showToast(data.error || 'Failed to process bulk upload', 'error');
      }
    } catch (err) {
      showToast('Network error processing bulk upload', 'error');
    } finally {
      setIsBulkUploading(false);
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads`);
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads || []);
      }

      if (isOperatorOrAdmin) {
        const monRes = await fetchWithAuth(`${API_BASE_URL}/leads/distribution-monitor`);
        const monData = await monRes.json();
        if (monRes.ok) {
          setMonitorData(monData);
        }
      }
    } catch (e) {
      console.error('Fetch leads error:', e);
      showToast('Failed to load leads list', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    if (user?.permissions?.includes(Permissions.LEADS_ASSIGN)) {
      fetchEmployees();
    }
  }, [user]);

  const handleUpdateLeadAssignment = async (leadId: number, assigneeIdStr: string) => {
    const assigneeId = parseInt(assigneeIdStr, 10);
    if (!assigneeId) return;

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to_id: assigneeId, reason: 'Inline reassignment' }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Lead assigned successfully', 'success');
        fetchLeads();
      } else {
        showToast(data.error || 'Failed to assign lead', 'error');
      }
    } catch (e) {
      showToast('Network error assigning lead', 'error');
    }
  };

  const handleUpdateStatus = async (leadId: number, newStatus: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    let notes = '';
    if (newStatus === 'LOST' || newStatus === 'DROPPED') {
      const reason = window.prompt(`Please provide a reason for dropping this lead:`);
      if (!reason) return;
      notes = reason;
    }

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Lead status updated`, 'success');
        fetchLeads();
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  const getStatusMap = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'QUALIFIED':
      case 'SITE_VISIT_SCHEDULED':
      case 'SITE_VISIT_COMPLETED':
      case 'NEGOTIATION':
        return 'hot';
      case 'CONTACTED':
      case 'DEMO_SCHEDULED':
      case 'DEMO_COMPLETED':
        return 'warm';
      case 'ASSIGNED':
      case 'QUALIFICATION_PENDING':
        return 'pending';
      case 'BOOKING_INITIATED':
      case 'BOOKED':
      case 'WON':
        return 'success';
      case 'DROPPED':
      case 'LOST':
        return 'danger';
      default:
        return 'default';
    }
  };

  const filteredLeads = leads.filter(l => statusFilter === 'ALL' || l.status === statusFilter);

  const columns: ColumnDef<Lead>[] = [
    {
      key: 'lead_code',
      header: 'Code',
      sortable: true,
      render: (l) => <span className="font-mono font-bold text-navy-900">{l.lead_code}</span>
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (l) => (
        <div>
          <div className="font-bold text-slate-800">{l.customer_name}</div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
            <PhoneCall className="w-3 h-3 text-slate-400" />
            {l.phone}
          </div>
        </div>
      )
    },
    {
      key: 'property_type_preference',
      header: 'Preference',
      sortable: true,
      render: (l) => (
        <div>
          <div className="font-medium text-slate-800">{l.property_type_preference || 'Residential'}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{l.preferred_location || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (l) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase">
          {l.source}
        </span>
      )
    },
    {
      key: 'assigned_to',
      header: 'Assigned To',
      sortable: true,
      render: (l) => {
        if (user?.permissions?.includes(Permissions.LEADS_ASSIGN)) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <select
                value={l.assigned_to?.id || ''}
                onChange={(e) => handleUpdateLeadAssignment(l.id, e.target.value)}
                className="w-full max-w-[140px] p-1.5 text-xs font-semibold bg-surface border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-navy-500"
              >
                <option value="">Unassigned Pool</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || emp.employee_code}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return l.assigned_to ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-[10px] shrink-0">
              {l.assigned_to.employee_code.slice(-3)}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-[11px] truncate">{l.assigned_to.full_name || l.assigned_to.employee_code}</div>
              <div className="text-[9px] text-slate-400 font-mono truncate">{l.assignment_type || 'AUTO'}</div>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 italic text-[11px]">Unassigned Pool</span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (l) => <StatusPill status={l.status} type={getStatusMap(l.status) as any} />
    },
    {
      key: 'actions',
      header: '',
      render: (l) => (
        <div className="text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLead(l);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-action hover:text-navy-900 transition-colors inline-flex items-center gap-1 font-semibold text-xs whitespace-nowrap"
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-navy-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-navy-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Leads & Distribution</h2>
          </div>
          <p className="text-xs text-navy-200/80">
            Intelligent auto-distribution algorithm based on telecaller score, response speed, and active load
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isOperatorOrAdmin && (
            <button
              onClick={handleBulkUploadBtnClick}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shadow"
            >
              <Upload className="w-4 h-4 text-navy-300" />
              <span>Bulk CSV Upload</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            data-tour="lead-create"
            className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Digital Lead Operator Intake Monitor */}
      {isOperatorOrAdmin && monitorData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-navy-600" /> Active Load Balancing
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-surface px-3 py-1 rounded-full">
              Total Leads: {monitorData.totalLeadsCount}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {monitorData.telecallers.map((tc: EmployeeListItem) => (
              <StatCard
                key={tc.id}
                label={tc.fullName || 'Unknown'}
                value={tc.activeLeadCount || 0}
                icon={ShieldCheck}
                trend={{
                  direction: 'up', // always green for positive metric presentation here or can omit if not purely direction
                  value: String(tc.closureRate || 0) + '%',
                  label: 'Closure Rate'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Leads Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-navy-900">Lead Pipeline</h3>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Filter Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-navy-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFICATION_PENDING">QUALIFICATION PENDING</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="SITE_VISIT_SCHEDULED">SITE VISIT SCHEDULED</option>
              <option value="NEGOTIATION">NEGOTIATION</option>
              <option value="BOOKING_INITIATED">BOOKING INITIATED</option>
              <option value="BOOKED">BOOKED</option>
              <option value="DROPPED">DROPPED</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Loading leads...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredLeads}
            onRowClick={setSelectedLead}
            searchable={true}
            emptyMessage="No leads found matching your criteria."
          />
        )}
      </div>

      {/* Quick Add Lead Modal */}
      {showAddModal && (
        <QuickAddLeadModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={(leadId) => {
            setShowAddModal(false);
            fetchLeads();
          }}
        />
      )}

      {/* Lead Detail Dossier Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateStatus={handleUpdateStatus}
          onRefreshLeads={fetchLeads}
        />
      )}

      {/* Bulk CSV Lead Preview Modal */}
      {showBulkModal && parsedBulkLeads.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => {
                setShowBulkModal(false);
                setParsedBulkLeads([]);
              }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-navy-700" />
              <h3 className="font-extrabold text-slate-800 text-lg">Bulk CSV Lead Importer</h3>
            </div>
            <p className="text-sm text-slate-600">
              Parsed <strong className="text-slate-900">{parsedBulkLeads.length} leads</strong>.
            </p>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Phone</th>
                    <th className="px-4 py-2">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedBulkLeads.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-medium text-slate-900">{row.customer_name}</td>
                      <td className="px-4 py-2 text-slate-600">{row.phone}</td>
                      <td className="px-4 py-2 text-slate-600">{row.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setParsedBulkLeads([]);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkUploading}
                onClick={handleConfirmBulkUpload}
                className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm rounded-lg shadow transition-colors"
              >
                {isBulkUploading ? 'Importing...' : 'Confirm & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
