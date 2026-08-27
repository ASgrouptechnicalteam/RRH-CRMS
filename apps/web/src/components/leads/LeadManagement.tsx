import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  UserCheck,
  PhoneCall,
  Calendar,
  Building2,
  TrendingUp,
  Tag,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  MapPin,
  LineChart,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { Roles, Permissions } from '@rrh-ems/shared';
import { AddLeadWizard } from './AddLeadWizard';
import {
  LeadActivity,
  MonitorData,
  EmployeeListItem,
  MatchItem,
  SavedInterestItem,
  LeadVisitItem,
  LeadTaskItem,
  LeadSalesOppItem,
  ParsedBulkLeadRow,
} from '../../types';

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
  activities?: LeadActivity[];
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
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Dossier Tabs & Auto-Matching Engine State
  const [dossierTab, setDossierTab] = useState<'DETAILS' | 'MATCHES' | 'INTERESTS' | 'VISITS' | 'FOLLOW_UPS' | 'SALES_OPPS'>('DETAILS');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [savedInterests, setSavedInterests] = useState<SavedInterestItem[]>([]);
  const [leadVisits, setLeadVisits] = useState<LeadVisitItem[]>([]);
  const [leadTasks, setLeadTasks] = useState<LeadTaskItem[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const fetchMatchesForLead = async (leadId: number) => {
    setIsLoadingMatches(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/matches`);
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches || []);
      }
    } catch (e) {
      console.error('Fetch matches error:', e);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const [leadSalesOpps, setLeadSalesOpps] = useState<LeadSalesOppItem[]>([]);
  const [isLoadingSalesOpps, setIsLoadingSalesOpps] = useState(false);
  
  const fetchLeadSalesOpps = async (leadId: number) => {
    setIsLoadingSalesOpps(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/opportunities?search=${leadId}`); // Backend doesn't have ?lead_id explicitly in query, but search might cover it, or we just rely on filtering locally or wait, the GET /opportunities endpoint might support filtering by search/keyword. Actually, backend GET /opportunities doesn't explicitly expose lead_id in the req.query list in packet 4. Let's check `search` or just fetch all and filter for now, or just use `lead_id` and hope it's supported. Ah, I remember `GET /opportunities` didn't have lead_id. But wait! I will use `GET /opportunities?search=...` if it exists. Let's just fetch all and filter for now since it's a frontend assignment, or `search=${leadId}`.
      // Wait, let's fetch all and filter in memory just in case the backend doesn't support lead_id query.
      const resAll = await fetchWithAuth(`${API_BASE_URL}/opportunities`);
      const data = await resAll.json();
      if (resAll.ok) {
        const filtered = (data.opportunities || []).filter((o: LeadSalesOppItem) => o.lead_id === leadId);
        setLeadSalesOpps(filtered);
      }
    } catch (e) {
      console.error('Fetch sales opps error:', e);
    } finally {
      setIsLoadingSalesOpps(false);
    }
  };

  const fetchSavedInterests = async (leadId: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/properties`);
      const data = await res.json();
      if (res.ok) {
        setSavedInterests(data.interests || []);
      }
    } catch (e) {
      console.error('Fetch interests error:', e);
    }
  };

  const fetchLeadVisits = async (leadId: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/site-visits?leadId=${leadId}`);
      const data = await res.json();
      if (res.ok) {
        setLeadVisits(data.visits || []);
      }
    } catch (e) {
      console.error('Fetch lead visits error:', e);
    }
  };

  const handleUpdateLeadStatus = async (leadId: number, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) return;
    
    let notes = '';
    if (newStatus === 'LOST') {
      const reason = window.prompt('Please provide a reason for dropping this lead (LOST):');
      if (!reason) return; // Cancelled or empty
      notes = reason;
    }

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      if (res.ok) {
        showToast('Lead status updated', 'success');
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (e) {
      showToast('Network error updating status', 'error');
    }
  };

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
        setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
        if (selectedLead?.id === leadId) {
          setSelectedLead(data.lead);
        }
      } else {
        showToast(data.error || 'Failed to assign lead', 'error');
      }
    } catch (e) {
      showToast('Network error assigning lead', 'error');
    }
  };

  const fetchLeadTasks = async (leadId: number) => {
    setIsLoadingTasks(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/tasks`);
      const data = await res.json();
      if (res.ok) {
        setLeadTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Fetch lead tasks error:', e);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleCreateTask = async (leadId: number) => {
    if (!newTaskTitle) return showToast('Title is required', 'error');
    setIsCreatingTask(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          priority: newTaskPriority,
          deadline: newTaskDeadline,
          lead_id: leadId,
          assignee_id: user?.id // Self-assign by default for follow-ups
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Follow-up task scheduled', 'success');
        setNewTaskTitle('');
        setNewTaskDesc('');
        fetchLeadTasks(leadId);
      } else {
        showToast(data.error || 'Failed to create task', 'error');
      }
    } catch (e) {
      showToast('Network error creating task', 'error');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleAddInterest = async (leadId: number, propertyId: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Property saved to interests', 'success');
        fetchSavedInterests(leadId);
      } else {
        showToast(data.error || 'Failed to save interest', 'error');
      }
    } catch (e) {
      showToast('Network error saving interest', 'error');
    }
  };

  const handleRemoveInterest = async (leadId: number, propertyId: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/properties/${propertyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Property removed from interests', 'success');
        fetchSavedInterests(leadId);
      } else {
        showToast(data.error || 'Failed to remove interest', 'error');
      }
    } catch (e) {
      showToast('Network error removing interest', 'error');
    }
  };

  const handleSendWhatsAppProposal = async (leadId: number, propertyId: number, defaultUrl?: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/whatsapp-proposal/${propertyId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('WhatsApp Proposal generated & logged in activity history!', 'success');
        const targetUrl = data.whatsAppUrl || defaultUrl;
        if (targetUrl) {
          window.open(targetUrl, '_blank');
        }
        fetchLeads();
      } else {
        showToast(data.error || 'Failed to send WhatsApp proposal', 'error');
      }
    } catch (e) {
      showToast('Error generating WhatsApp proposal', 'error');
    }
  };

  const handleConvertToCustomer = async (leadId: number) => {
    setIsConverting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/convert-to-customer`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.status === 409) {
        showToast('Lead has already been converted to a customer.', 'error');
      } else if (res.ok) {
        showToast('Successfully converted to Customer!', 'success');
        setDossierTab('DETAILS');
        setSelectedLead(null);
        navigate('/customers');
      } else {
        showToast(data.error || 'Failed to convert to customer', 'error');
      }
    } catch (e) {
      showToast('Network error converting to customer', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  // File Input Ref for native OS File Manager
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [parsedBulkLeads, setParsedBulkLeads] = useState<ParsedBulkLeadRow[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // New Lead Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('MANUAL_ENTRY');
  const [projectName, setProjectName] = useState('');
  const [propertyType, setPropertyType] = useState('RESIDENTIAL_VILLA');
  const [budgetMax, setBudgetMax] = useState('15000000');
  const [preferredLocation, setPreferredLocation] = useState('Miyapur / Gachibowli');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [scheduleNotes, setScheduleNotes] = useState('Telecaller booked site visit for client discussion.');
  const [schedulePropertyId, setSchedulePropertyId] = useState<string>('');

  // Local toast state was removed to avoid conflict with useToast
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

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) return;

    setIsSubmitting(true);
    
    let finalNotes = notes;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          phone,
          email,
          source,
          property_type_preference: propertyType,
          budget_max: parseFloat(budgetMax) || null,
          preferred_location: preferredLocation,
          notes: finalNotes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          `Lead ${data.lead.lead_code} created! Auto-assigned to ${data.assignedTo ? data.assignedTo.name : 'Queue'}`,
          'success'
        );
        setShowAddModal(false);
        setCustomerName('');
        setPhone('');
        setEmail('');
        setNotes('');
        fetchLeads();
      } else {
        showToast(data.error || 'Failed to create lead', 'error');
      }
    } catch (err) {
      showToast('Network error while creating lead', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (leadId: number, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Lead status updated to ${newStatus}`, 'success');
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

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.lead_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.assigned_to?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CONTACTED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'QUALIFIED':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'SITE_VISIT_SCHEDULED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'WON':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'LOST':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-teal-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Leads & Performance-Weighted Engine</h2>
          </div>
          <p className="text-xs text-teal-200/80">
            Intelligent auto-distribution algorithm based on telecaller score, response speed, and active load
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Hidden File Input for Native File Manager window */}
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
              <Upload className="w-4 h-4 text-teal-300" />
              <span>Bulk CSV Upload</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            data-tour="lead-create"
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Digital Lead Operator Intake Monitor */}
      {isOperatorOrAdmin && monitorData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-800">Telecaller Intake Volume & Weighted Load Balancing</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Total Leads: {monitorData.totalLeadsCount}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {monitorData.telecallers.map((tc: EmployeeListItem) => (
              <div key={tc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{tc.fullName}</span>
                  <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                    {tc.employeeCode}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Active Load: <strong className="text-slate-700">{tc.activeLeadCount}</strong></span>
                  <span>Closure: <strong className="text-emerald-700">{tc.closureRate}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Leads Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Lead ID, Name, Phone, Assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="SITE_VISIT_SCHEDULED">SITE VISIT SCHEDULED</option>
              <option value="WON">WON</option>
              <option value="LOST">LOST</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading lead database...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No leads found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-4">Lead Code</th>
                  <th className="py-3 px-4">Customer Name & Phone</th>
                  <th className="py-3 px-4">Preference & Location</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Assigned Telecaller</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-900">{lead.lead_code}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-800">{lead.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <PhoneCall className="w-3 h-3 text-slate-400" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{lead.property_type_preference || 'Residential'}</div>
                      <div className="text-[11px] text-slate-400">{lead.preferred_location || 'Hyderabad'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {user?.permissions?.includes(Permissions.LEADS_ASSIGN) ? (
                        <select
                          value={lead.assigned_to?.id || ''}
                          onChange={(e) => handleUpdateLeadAssignment(lead.id, e.target.value)}
                          className="w-full max-w-[120px] p-1.5 text-[10px] uppercase font-extrabold tracking-wider bg-teal-50 border border-teal-200 rounded text-teal-800 focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Unassigned Pool</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.full_name || emp.employee_code}
                            </option>
                          ))}
                        </select>
                      ) : (
                        lead.assigned_to ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                              {lead.assigned_to.employee_code.slice(-3)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-[11px]">{lead.assigned_to.full_name || lead.assigned_to.employee_code}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{lead.assignment_type || 'AUTO'}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned Pool</span>
                        )
                      )}
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {user?.permissions?.includes(Permissions.LEADS_UPDATE) ? (
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value, lead.status)}
                          className={`p-1.5 text-[10px] uppercase font-extrabold tracking-wider border rounded focus:ring-2 focus:ring-teal-500 ${getStatusBadge(lead.status)}`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="ASSIGNED">ASSIGNED</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="QUALIFIED">QUALIFIED</option>
                          <option value="SITE_VISIT_SCHEDULED">SITE VISIT SCHEDULED</option>
                          <option value="NEGOTIATION">NEGOTIATION</option>
                          <option value="OPPORTUNITY_OPEN">OPPORTUNITY OPEN</option>
                          <option value="WON">WON</option>
                          <option value="LOST">LOST</option>
                          <option value="RECOVERED_TO_POOL">RECOVERED TO POOL</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setDossierTab('DETAILS');
                          fetchMatchesForLead(lead.id);
                          fetchSavedInterests(lead.id);
                          fetchLeadVisits(lead.id);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-all inline-flex items-center gap-1 font-bold text-xs"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadWizard 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchLeads();
          }}
          users={[]} // pass empty array for now, not strictly used in lead wizard logic
        />
      )}

      {/* Lead Detail Dossier Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-teal-800 text-sm">{selectedLead.lead_code}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedLead.status)}`}>
                {selectedLead.status}
              </span>
            </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xl">{selectedLead.customer_name}</h3>
                  <p className="text-xs text-slate-500 font-mono mb-4">{selectedLead.phone} {selectedLead.email ? `• ${selectedLead.email}` : ''}</p>
                </div>
                {selectedLead.lead_score !== undefined && (
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-200 font-extrabold text-xs">
                      {selectedLead.lead_score} PTS
                    </div>
                    {selectedLead.sla_breach_at && new Date(selectedLead.sla_breach_at) < new Date() && (
                      <span className="text-[10px] text-red-600 font-bold mt-1">SLA BREACHED</span>
                    )}
                  </div>
                )}
              </div>
  
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5 text-xs">
                {/* ── Attribution block ─────────────────────────────────── */}
                <div
                  data-tour="lead-attribution-block"
                  className="col-span-2 grid grid-cols-2 gap-3 bg-white rounded-xl p-3 border border-slate-200 shadow-sm"
                >
                  {/* Introduced By — permanent attribution */}
                  <div className="flex items-start gap-2.5 p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="mt-0.5 p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-indigo-500 text-[9px] uppercase font-black tracking-widest block">Introduced By</span>
                      <div className="font-bold text-indigo-900 mt-0.5 truncate">{selectedLead.created_by?.full_name || selectedLead.created_by?.employee_code || 'System'}</div>
                      <span className="text-[9px] text-indigo-400 font-semibold">Permanent Attribution</span>
                    </div>
                  </div>
                  {/* Assigned To — operational / mutable */}
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="mt-0.5 p-1.5 bg-slate-200 rounded-lg flex-shrink-0">
                      <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400 text-[9px] uppercase font-black tracking-widest block">Assigned To</span>
                      <div className="font-bold text-slate-800 mt-0.5 truncate">{selectedLead.assigned_to?.full_name || 'Unassigned'}</div>
                      <span className="text-[9px] text-slate-400 font-semibold">Current Owner</span>
                    </div>
                  </div>
                </div>
                {/* ── Rest of metadata ──────────────────────────────────── */}
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Created</span>
                  <div className="font-bold text-slate-800 mt-0.5">{new Date(selectedLead.created_at).toLocaleDateString()}</div>
                </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Source</span>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {selectedLead.source}
                      {selectedLead.source === 'REFERRAL' && selectedLead.referral_person_name && (
                        <span className="ml-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          by {selectedLead.referral_person_name}
                        </span>
                      )}
                    </div>
                  </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Location</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedLead.preferred_location || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Preference & Budget</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedLead.property_type_preference || 'N/A'} (₹{selectedLead.budget_max ? (selectedLead.budget_max / 100000).toFixed(1) + ' Lakhs' : 'Flexible'})</div>
                </div>
                {selectedLead.campaign && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-slate-200 flex gap-4">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Campaign</span>
                      <div className="font-bold text-slate-800 mt-0.5">{selectedLead.campaign}</div>
                    </div>
                    {selectedLead.utm_source && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">UTM Source</span>
                        <div className="font-bold text-slate-800 mt-0.5">{selectedLead.utm_source}</div>
                      </div>
                    )}
                    {selectedLead.utm_medium && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">UTM Medium</span>
                        <div className="font-bold text-slate-800 mt-0.5">{selectedLead.utm_medium}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            {/* Dossier Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 mb-4 pb-2">
              <button
                onClick={() => setDossierTab('DETAILS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  dossierTab === 'DETAILS' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Lead Info & Activity
              </button>
              <button
                onClick={() => {
                  setDossierTab('MATCHES');
                  fetchMatchesForLead(selectedLead.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  dossierTab === 'MATCHES' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-teal-300" />
                <span>Live Matches ({matches.length})</span>
              </button>
              <button
                onClick={() => {
                  setDossierTab('INTERESTS');
                  fetchSavedInterests(selectedLead.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  dossierTab === 'INTERESTS' ? 'bg-indigo-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                <span>Saved Interests ({savedInterests.length})</span>
              </button>
              <button
                onClick={() => {
                  setDossierTab('VISITS');
                  fetchLeadVisits(selectedLead.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  dossierTab === 'VISITS' ? 'bg-amber-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>Site Visits ({leadVisits.length})</span>
              </button>
              <button
                onClick={() => {
                  setDossierTab('FOLLOW_UPS');
                  fetchLeadTasks(selectedLead.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  dossierTab === 'FOLLOW_UPS' ? 'bg-rose-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-300" />
                <span>Follow-ups ({leadTasks.length})</span>
              </button>
              <button
                onClick={() => {
                  setDossierTab('SALES_OPPS');
                  fetchLeadSalesOpps(selectedLead.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  dossierTab === 'SALES_OPPS' ? 'bg-indigo-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LineChart className="w-3.5 h-3.5 text-indigo-300" />
                <span>Sales Opportunities</span>
              </button>
            </div>

            {dossierTab === 'DETAILS' && (
              <>
                {/* Quick Lifecycle Status Change & Book Site Visit */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">Update Lifecycle Status</label>
                    <div className="flex gap-2">
                      {user?.permissions?.includes(Permissions.CUSTOMERS_CONVERT) && (
                        <button
                          onClick={() => handleConvertToCustomer(selectedLead.id)}
                          disabled={isConverting}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-xl shadow transition-all flex items-center gap-1 disabled:opacity-70"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{isConverting ? 'Converting...' : 'Convert to Customer'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-xl shadow transition-all flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Book Site Visit / Demo</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['CONTACTED', 'QUALIFIED', 'SITE_VISIT_SCHEDULED', 'WON', 'LOST'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedLead.id, st)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                          selectedLead.status === st
                            ? 'bg-teal-700 text-white border-teal-800 shadow'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Activity & Audit Timeline</h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-4">
                    {selectedLead.activities?.map((act: LeadActivity) => (
                      <div key={act.id} className="relative text-xs space-y-0.5">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>{act.activity_type.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{act.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {dossierTab === 'MATCHES' && (
              /* Auto-Matching LIVE Properties View */
              <div className="space-y-4">
                {isLoadingMatches ? (
                  <div className="py-8 text-center text-xs text-slate-400">Evaluating live property inventory matches...</div>
                ) : matches.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No LIVE properties currently match this lead's budget & location requirements.</div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((m: MatchItem) => (
                      <div key={m.propertyId} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-teal-900 text-xs">{m.propertyCode}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${m.matchScore >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                            {m.matchScore}% Match Score
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{m.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{m.location} • ₹{(m.price / 100000).toFixed(1)} Lakhs • {m.areaSqft} sq.ft</p>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-700">
                          <span className={`flex items-center gap-1 ${m.matchBreakdown.locationMatch ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {m.matchBreakdown.locationMatch ? '✓ Location Match' : '✗ Location Diff'}
                          </span>
                          <span className={`flex items-center gap-1 ${m.matchBreakdown.budgetMatch ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {m.matchBreakdown.budgetMatch ? '✓ Budget Fit' : '✗ Budget High'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddInterest(selectedLead.id, m.propertyId)}
                            className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Save to Interests</span>
                          </button>
                          <button
                            onClick={() => handleSendWhatsAppProposal(selectedLead.id, m.propertyId, m.whatsAppUrl)}
                            className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                          >
                            <PhoneCall className="w-4 h-4 text-emerald-300" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {dossierTab === 'INTERESTS' && (
              <div className="space-y-4">
                {savedInterests.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No properties have been saved to interests yet.</div>
                ) : (
                  <div className="space-y-3">
                    {savedInterests.map((interest: SavedInterestItem) => (
                      <div key={interest.id} className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-3 shadow-sm relative">
                        <button
                          onClick={() => handleRemoveInterest(selectedLead.id, interest.property_id)}
                          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Interest"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="pr-8">
                          <span className="font-mono font-bold text-indigo-900 text-xs">{interest.property.property_code}</span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-1">{interest.property.title}</h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Added on {new Date(interest.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {dossierTab === 'VISITS' && (
              <div className="space-y-4">
                {leadVisits.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No site visits booked for this lead.</div>
                ) : (
                  <div className="space-y-3">
                    {leadVisits.map((visit: LeadVisitItem) => (
                      <div key={visit.id} className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-amber-900 text-xs">{visit.booking_code}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-white border-amber-200 text-amber-800">
                            {visit.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {visit.property && (
                          <div className="mb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Property</span>
                            <span className="text-xs font-bold text-slate-800">{visit.property.title} ({visit.property.property_code})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-600 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(visit.scheduled_date).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {dossierTab === 'FOLLOW_UPS' && (
              <div className="space-y-5">
                {/* Create Follow-up Task Form */}
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-rose-600" /> Schedule New Follow-up
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Task Title (e.g. Call back regarding pricing)"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      />
                    </div>
                    <div className="col-span-2">
                      <textarea
                        placeholder="Additional notes..."
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50 min-h-[60px]"
                      />
                    </div>
                    <div>
                      <input
                        type="datetime-local"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      />
                    </div>
                    <div>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex justify-end pt-1">
                      <button
                        onClick={() => handleCreateTask(selectedLead.id)}
                        disabled={isCreatingTask || !newTaskTitle}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
                      >
                        {isCreatingTask ? 'Scheduling...' : 'Schedule Task'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Scheduled Follow-ups</h4>
                  {isLoadingTasks ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading tasks...</div>
                  ) : leadTasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      No follow-up tasks scheduled for this lead.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leadTasks.map((task: LeadTaskItem) => (
                        <div key={task.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-start gap-3">
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'PENDING' ? 'bg-amber-400' : task.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className={`font-bold text-sm ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h5>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className={`text-xs mb-2 ${task.status === 'COMPLETED' ? 'text-slate-400' : 'text-slate-600'}`}>{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(task.target_date).toLocaleString()}</span>
                              <span className="flex items-center gap-1">Assigned: {task.assignee?.full_name || 'Unassigned'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {dossierTab === 'SALES_OPPS' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" /> Linked Sales Opportunities
                  </h4>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetchWithAuth(`${API_BASE_URL}/opportunities`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ lead_id: selectedLead.id })
                        });
                        if (!res.ok) throw new Error('Failed to create sales opportunity');
                        showToast('Sales opportunity created successfully', 'success');
                        fetchLeadSalesOpps(selectedLead.id);
                      } catch (e: unknown) {
                        const message = e instanceof Error ? e.message : String(e);
                        showToast(message, 'error');
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Sales Opportunity
                  </button>
                </div>
                
                {isLoadingSalesOpps ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : leadSalesOpps.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <Briefcase className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No sales opportunities found for this lead.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {leadSalesOpps.map((opp: LeadSalesOppItem) => (
                      <div key={opp.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-mono text-slate-400 mb-0.5">#{opp.id}</div>
                            <h5 className="font-bold text-slate-800 text-sm">
                              {opp.project?.name ? `${opp.project.name} Sales Opportunity` : 'Open Sales Opportunity'}
                            </h5>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                            {opp.stage.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Expected Value</p>
                            <p className="text-xs font-bold text-slate-700">₹{(Number(opp.expected_value || 0) / 100000).toFixed(1)}L</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Created On</p>
                            <p className="text-xs font-bold text-slate-700">{new Date(opp.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // In a real app we might open the details right here, or redirect to Pipeline tab.
                            // For Packet 5, we can navigate to Sales Pipeline.
                            navigate('/sales-pipeline');
                            showToast(`Navigating to Sales Pipeline for Opportunity #${opp.id}`, 'info');
                          }}
                          className="mt-2 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-indigo-700 font-semibold text-xs rounded-lg transition-colors"
                        >
                          View in Sales Pipeline
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk CSV Lead Preview Modal */}
      {showBulkModal && parsedBulkLeads.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
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
              <Upload className="w-5 h-5 text-teal-700" />
              <h3 className="font-extrabold text-slate-800 text-lg">Bulk CSV Lead Importer Preview</h3>
            </div>
            <p className="text-xs text-slate-600">
              Parsed <strong className="text-slate-900">{parsedBulkLeads.length} lead records</strong> from selected file. Leads will be automatically distributed across active telecallers using real-time performance weights.
            </p>

            {/* Parsed Preview Table */}
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Customer Name</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5">Property Type</th>
                    <th className="p-2.5">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedBulkLeads.map((row: ParsedBulkLeadRow, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{row.customer_name}</td>
                      <td className="p-2.5 text-slate-700">{row.phone}</td>
                      <td className="p-2.5 text-slate-600 font-medium">{row.property_type}</td>
                      <td className="p-2.5 text-slate-600">{row.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setParsedBulkLeads([]);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkUploading}
                onClick={handleConfirmBulkUpload}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
              >
                {isBulkUploading ? 'Auto-Distributing...' : `Confirm & Import (${parsedBulkLeads.length} Leads)`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Schedule Site Visit Modal */}
      {showScheduleModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <h3 className="font-extrabold text-sm tracking-wide">Book Site Visit / Demo</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Booking site visit for lead: <span className="font-bold text-slate-800">{selectedLead.customer_name}</span> ({selectedLead.lead_code})
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Verification / Visit Notes</label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[80px]"
                  placeholder="Enter important notes for the visit..."
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Attach Property (Optional)</label>
                <select
                  value={schedulePropertyId}
                  onChange={(e) => setSchedulePropertyId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="">-- No Property Attached --</option>
                  {savedInterests.map((interest) => (
                    <option key={interest.property_id} value={interest.property_id}>
                      {interest.property.title} ({interest.property.property_code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Select from lead's saved properties</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!scheduleDate) {
                      alert('Please select a date');
                      return;
                    }
                    try {
                      const res = await fetchWithAuth(`${API_BASE_URL}/site-visits`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lead_id: selectedLead.id,
                          scheduled_date: scheduleDate,
                          notes: scheduleNotes,
                          property_id: schedulePropertyId ? parseInt(schedulePropertyId, 10) : undefined,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        alert('Site visit booked successfully!');
                        setShowScheduleModal(false);
                        fetchLeads();
                      } else {
                        alert(data.error || 'Failed to book site visit');
                      }
                    } catch (err) {
                      alert('Error booking site visit');
                    }
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
