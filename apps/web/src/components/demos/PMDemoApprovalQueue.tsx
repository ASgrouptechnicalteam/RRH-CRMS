import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  Building2,
  UserCircle,
  CheckCircle,
  RefreshCcw,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { StatusPill } from '../ui/StatusPill';
import { handleApiError, toUserFacingError } from '../../utils/userFacingError';
import { EmployeeListItem } from '../../types';

interface BlindDemo {
  id: number;
  lead_code: string;
  scheduled_at: string;
  telecaller?: { id: number; full_name: string; employee_code: string }; // Not direct, via lead
  property?: { title: string; property_code: string };
  lead?: {
    preferred_location?: string;
    customer_name?: string;
    assigned_to?: { id: number; full_name: string; employee_code: string };
    created_by?: { id: number; full_name: string; employee_code: string };
  };
  interested_properties?: { property?: { title: string; property_code: string } }[];
}

export const PMDemoApprovalQueue: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { showToast, showError } = useToast();

  const [visits, setVisits] = useState<BlindDemo[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [showDeclineModal, setshowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      // Fetch only PENDING demos
      const res = await fetchWithAuth(`${API_BASE_URL}/demos?status=PENDING`);
      const data = await res.json();
      if (res.ok) {
        setVisits(data.demos || []);
      }

      const empRes = await fetchWithAuth(`${API_BASE_URL}/employees`);
      const empData = await empRes.json();
      if (empRes.ok) {
        // Only PMs and Agents can be declinement targets per policy
        const targets = (empData.employees || []).filter(
          (e: EmployeeListItem) =>
            e.roles?.includes('project managers') || e.roles?.includes('Agent'),
        );
        setEmployees(targets);
      }
    } catch (e) {
      console.error('Fetch queue error:', e);
      showError(
        toUserFacingError({ message: e instanceof Error ? e.message : String(e), body: e }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAccept = async (visitId: number) => {
    if (!window.confirm('Are you sure you want to accept and assign this visit to yourself?'))
      return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/demos/${visitId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Demo accepted successfully', 'success');
        fetchQueue();
      } else {
        await handleApiError(res, showError, data);
      }
    } catch (err) {
      showError(
        toUserFacingError({ message: err instanceof Error ? err.message : String(err), body: err }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitId || !declineReason) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/demos/${selectedVisitId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: declineReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Demo declined successfully', 'success');
        setshowDeclineModal(false);
        setDeclineReason('');
        fetchQueue();
      } else {
        await handleApiError(res, showError, data);
      }
    } catch (err) {
      showError(
        toUserFacingError({ message: err instanceof Error ? err.message : String(err), body: err }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitId || !reassignTargetId || !reassignReason) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/demos/${selectedVisitId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handler_id: parseInt(reassignTargetId, 10),
          reason: reassignReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Demo reassigned successfully', 'success');
        setShowReassignModal(false);
        setReassignReason('');
        setReassignTargetId('');
        fetchQueue();
      } else {
        await handleApiError(res, showError, data);
      }
    } catch (err) {
      showError(
        toUserFacingError({ message: err instanceof Error ? err.message : String(err), body: err }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-navy-600" />
              Incoming Demos
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Accept or route new requests. Customer details are hidden until accepted.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShieldCheck className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 text-sm">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-navy-600" />
            Incoming Demos
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Accept or route new requests. Customer details are hidden until accepted.
          </p>
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-navy-900 mb-1">Queue is empty</h3>
          <p className="text-slate-500 text-sm">No new Demos waiting for approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-navy-50 text-navy-700 px-3 py-1 rounded-lg text-xs font-bold font-mono border border-navy-100">
                  {visit.lead_code}
                </div>
                <StatusPill status="PENDING" type="pending" />
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                    <Building2 className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Requested Property
                    </p>
                    <p className="font-bold text-navy-900 leading-tight">
                      {visit.interested_properties?.[0]?.property?.title ||
                        visit.property?.title ||
                        'General Inquiry'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Location Preference
                    </p>
                    <p className="font-semibold text-slate-700">
                      {visit.lead?.preferred_location || 'Not Specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                    <UserCircle className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Requested By
                    </p>
                    <p className="font-semibold text-slate-700">
                      {visit.lead?.assigned_to?.full_name ||
                        visit.lead?.created_by?.full_name ||
                        'System'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleAccept(visit.id)}
                  disabled={isSubmitting}
                  className="flex-1 bg-navy-600 hover:bg-navy-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={() => {
                    setSelectedVisitId(visit.id);
                    setShowReassignModal(true);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Route
                </button>
                <button
                  onClick={() => {
                    setSelectedVisitId(visit.id);
                    setshowDeclineModal(true);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900">Decline Visit</h3>
              <button
                onClick={() => setshowDeclineModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeclineSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Reason for Declining
                </label>
                <textarea
                  required
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="E.g., Out of office, overloaded..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setshowDeclineModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-white text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-navy-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-navy-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900">Route Demo</h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReassignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Select Handler
                </label>
                <select
                  required
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                >
                  <option value="">-- Choose Handler --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.roles?.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Reason for Routing
                </label>
                <textarea
                  required
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                  placeholder="Why are you routing this to them?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reassignTargetId || !reassignReason}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-navy-600 hover:bg-navy-700 rounded-xl disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? 'Routing...' : 'Confirm Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
