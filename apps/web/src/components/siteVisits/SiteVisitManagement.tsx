import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Camera,
  Plus,
  X,
  User,
  ShieldCheck,
  Star,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';

interface SiteVisit {
  id: number;
  booking_code: string;
  lead_id: number;
  scheduled_date: string;
  status: 'PENDING_VERIFICATION' | 'CONFIRMED' | 'ASSIGNED_TO_AGENT' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';
  verification_call_notes?: string;
  feedback_notes?: string;
  rating?: string;
  proof_photo_url?: string;
  lead: { id: number; lead_code: string; customer_name: string; phone: string; preferred_location?: string };
  telecaller: { id: number; employee_code: string; full_name: string; phone: string };
  project_manager?: { id: number; employee_code: string; full_name: string; phone: string };
  assigned_agent?: { id: number; employee_code: string; full_name: string; phone: string };
  property?: { id: number; property_code: string; title: string; status: string };
}

const VISIT_STAGES = [
  { key: 'PENDING_VERIFICATION', label: '1. Verify' },
  { key: 'CONFIRMED', label: '2. Confirmed' },
  { key: 'ASSIGNED_TO_AGENT', label: '3. Agent Dispatched' },
  { key: 'COMPLETED', label: '4. Completed' },
];

const SiteVisitStepper: React.FC<{ status: SiteVisit['status'] }> = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="px-3 py-1 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold text-[11px] inline-flex items-center gap-1.5 my-1">
        <X className="w-3.5 h-3.5" />
        <span>Visit Cancelled</span>
      </div>
    );
  }
  if (status === 'RESCHEDULED') {
    return (
      <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-bold text-[11px] inline-flex items-center gap-1.5 my-1">
        <Clock className="w-3.5 h-3.5" />
        <span>Visit Rescheduled</span>
      </div>
    );
  }

  const currentIndex = VISIT_STAGES.findIndex((s) => s.key === status);

  return (
    <div className="w-full my-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
        <span>Field Dispatch Progress</span>
        <span className="text-sky-800 font-bold">
          {status === 'COMPLETED' ? 'Visit Complete' : `Stage ${currentIndex + 1} of 4`}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {VISIT_STAGES.map((stg, idx) => {
          const isCurrent = stg.key === status;
          const isPassed = status === 'COMPLETED' || (currentIndex >= 0 && idx < currentIndex);
          return (
            <div
              key={stg.key}
              className={`px-1 py-1 rounded-lg text-[9px] font-bold text-center leading-tight transition-all ${
                isCurrent
                  ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400'
                  : isPassed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200/70 text-slate-500'
              }`}
            >
              <div className="truncate">{stg.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SiteVisitManagement: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Form states
  const [verificationNotes, setVerificationNotes] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [rating, setRating] = useState('HOT_INTERESTED');
  const [proofPhotoUrl, setProofPhotoUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPMOrMD = user?.roles?.some((r) => ['Project Manager (Site)', 'Project Manager', 'MD', 'Admin (Technical)'].includes(r));

  const fetchVisitsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/site-visits`);
      const data = await res.json();
      if (res.ok) setVisits(data.visits || []);

      const empRes = await fetchWithAuth(`${API_BASE_URL}/employees`);
      const empData = await empRes.json();
      if (empRes.ok) setEmployees(empData.employees || []);
    } catch (e) {
      console.error('Fetch site visits error:', e);
      showToast('Failed to load site visit bookings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitsData();
  }, []);

  const handleVerifyCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/site-visits/${selectedVisit.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed: true,
          verification_notes: verificationNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setShowVerifyModal(false);
        fetchVisitsData();
      } else {
        showToast(data.error || 'Failed to verify schedule', 'error');
      }
    } catch (err) {
      showToast('Error verifying site visit call', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !assignedAgentId) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/site-visits/${selectedVisit.id}/assign-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: parseInt(assignedAgentId, 10),
          notes: dispatchNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setShowAssignModal(false);
        fetchVisitsData();
      } else {
        showToast(data.error || 'Failed to assign agent', 'error');
      }
    } catch (err) {
      showToast('Error assigning agent', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !feedbackNotes) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/site-visits/${selectedVisit.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_notes: feedbackNotes,
          rating,
          proof_photo_url: proofPhotoUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setShowCompleteModal(false);
        fetchVisitsData();
      } else {
        showToast(data.error || 'Failed to record completion', 'error');
      }
    } catch (err) {
      showToast('Error completing site visit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'CONFIRMED':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'ASSIGNED_TO_AGENT':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-sky-950 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-teal-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-extrabold tracking-tight">On-Site Visit & Field Agent Dispatch Workflow</h2>
          </div>
          <p className="text-xs text-teal-200/80">
            Real-time pipeline: Telecaller Booking $\rightarrow$ Verification Call Confirmation $\rightarrow$ PM Agent Dispatch $\rightarrow$ Field Visit Completion & On-Site Feedback Upload.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-teal-300 block">Total Site Visits</span>
            <span className="text-lg font-black text-white">{visits.length} Scheduled</span>
          </div>
        </div>
      </div>

      {/* Visits Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading site visit bookings...</div>
      ) : visits.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No site visits currently scheduled. Book site visits directly inside Lead Details</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-teal-900 text-xs">{visit.booking_code}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(visit.status)}`}>
                    {visit.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">{visit.lead?.customer_name}</h3>
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-mono">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    {visit.lead?.phone} ({visit.lead?.preferred_location || 'Hyderabad'})
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Scheduled: {new Date(visit.scheduled_date).toLocaleString()}</span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">Telecaller:</span> {visit.telecaller?.full_name}
                  </div>

                  {visit.property && (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">Property:</span> {visit.property.title} ({visit.property.property_code})
                    </div>
                  )}

                  {visit.project_manager && (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">PM Oversight:</span> {visit.project_manager?.full_name}
                    </div>
                  )}

                  {visit.assigned_agent && (
                    <div className="text-[11px] text-slate-700 font-bold bg-purple-50 p-1.5 rounded-xl border border-purple-200">
                      Field Agent Dispatched: {visit.assigned_agent?.full_name} ({visit.assigned_agent?.phone})
                    </div>
                  )}
                </div>

                {visit.feedback_notes && (
                  <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/60 text-xs space-y-1">
                    <span className="font-extrabold text-emerald-900 block">Customer Feedback ({visit.rating}):</span>
                    <p className="text-slate-700 text-[11px] italic">"{visit.feedback_notes}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons based on Workflow Stage */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {visit.status === 'PENDING_VERIFICATION' && (
                  <button
                    onClick={() => {
                      setSelectedVisit(visit);
                      setShowVerifyModal(true);
                    }}
                    className="w-full py-2 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call & Confirm Schedule</span>
                  </button>
                )}

                {visit.status === 'CONFIRMED' && isPMOrMD && (
                  <button
                    onClick={() => {
                      setSelectedVisit(visit);
                      setShowAssignModal(true);
                    }}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign Field Agent</span>
                  </button>
                )}

                {(visit.status === 'ASSIGNED_TO_AGENT' || visit.status === 'CONFIRMED') && (
                  <button
                    onClick={() => {
                      setSelectedVisit(visit);
                      setShowCompleteModal(true);
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Visit Feedback & Photo</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Telecaller Call & Confirm Schedule */}
      {showVerifyModal && selectedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-800 text-lg mb-1">Verify Site Visit Call Schedule</h3>
            <p className="text-xs text-slate-500 mb-4">
              Telecaller verification call for client <strong className="text-slate-800">{selectedVisit.lead?.customer_name}</strong>
            </p>

            <form onSubmit={handleVerifyCall} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Verification Call Notes *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Client confirmed availability for tomorrow 11 AM at Gachibowli site..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm & Transfer to PM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: PM Assign Field Agent */}
      {showAssignModal && selectedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-800 text-lg mb-1">Assign Field Agent for Site Visit</h3>
            <p className="text-xs text-slate-500 mb-4">
              Dispatch an on-site field agent for visit <strong className="text-slate-800">{selectedVisit.booking_code}</strong>
            </p>

            <form onSubmit={handleAssignAgent} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Select Field Agent *</label>
                <select
                  required
                  value={assignedAgentId}
                  onChange={(e) => setAssignedAgentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold text-slate-800"
                >
                  <option value="">Select Agent</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.employeeCode} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Dispatch Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pickup key from site office, show 3BHK Villa #4..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Dispatching...' : 'Dispatch Field Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Complete Visit, Upload Feedback & Photo */}
      {showCompleteModal && selectedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowCompleteModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-800 text-lg mb-1">Record Site Visit Completion</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter customer feedback and proof photo for <strong className="text-slate-800">{selectedVisit.lead?.customer_name}</strong>
            </p>

            <form onSubmit={handleCompleteVisit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Customer Interest Rating *</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-extrabold text-slate-800"
                >
                  <option value="HOT_INTERESTED">🔥 Hot - Highly Interested (Move to Qualified)</option>
                  <option value="WARM">☀️ Warm - Interested (Move to Negotiation)</option>
                  <option value="COLD">❄️ Cold - Low Interest</option>
                  <option value="NOT_INTERESTED">❌ Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">On-Site Customer Feedback *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Liked 3BHK corner unit, requested 5% discount on registration charges..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">On-Site Proof Photo URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                  value={proofPhotoUrl}
                  onChange={(e) => setProofPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Recording...' : 'Complete Visit & Update Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
