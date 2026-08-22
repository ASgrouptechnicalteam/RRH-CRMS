import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { Roles } from '@rrh-ems/shared';


export const LateLeaveProposals: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'queue'>('submit');
  const [proposalType, setProposalType] = useState<'late' | 'leave'>('late');

  // Form states
  const [date, setDate] = useState('');
  const [expectedTime, setExpectedTime] = useState('11:00');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [queue, setQueue] = useState<any[]>([]);

  const isHrOrMd = user?.roles.some((r) => r === Roles.HR_MANAGER || r === Roles.MD);

  useEffect(() => {
    if (isHrOrMd && activeTab === 'queue') {
      fetchQueue();
    }
  }, [activeTab, isHrOrMd]);

  const fetchQueue = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/attendance/proposals/queue`);
      const data = await res.json();
      if (res.ok) {
        setQueue(data.proposals || []);
      }
    } catch (e) {
      console.error('Failed to load proposal queue');
    }
  };

  const handleSubmitLate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/attendance/late-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date || new Date().toISOString().split('T')[0],
          expected_time: expectedTime,
          reason,
        }),
      });


      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit late proposal');
      }

      setMessage({ type: 'success', text: 'Late proposal submitted to HR queue!' });
      setReason('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Attendance Proposals</h3>
          <p className="text-xs text-slate-500">Submit late arrival requests or view HR queue</p>
        </div>

        {isHrOrMd && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'submit' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
              }`}
            >
              Submit Request
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'queue' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
              }`}
            >
              HR Approval Queue
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {activeTab === 'submit' ? (
        <div>
          {/* Proposal Type Toggle */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setProposalType('late')}
              className={`p-3 rounded-xl border text-left transition-all ${
                proposalType === 'late'
                  ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-bold'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>Late Arrival Request</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1">
                Must submit before 09:30 AM IST same day
              </p>
            </button>

            <button
              type="button"
              onClick={() => setProposalType('leave')}
              className={`p-3 rounded-xl border text-left transition-all ${
                proposalType === 'leave'
                  ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-bold'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-teal-700" />
                <span>Leave Request</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1">
                Must submit ≥ 1 day in advance
              </p>
            </button>
          </div>

          {/* Form */}
          {proposalType === 'late' ? (
            <form onSubmit={handleSubmitLate} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Arrival Time</label>
                  <input
                    type="time"
                    value={expectedTime}
                    onChange={(e) => setExpectedTime(e.target.value)}
                    required
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Late Arrival</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Doctor appointment, traffic delay..."
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Late Request</span>
              </button>
            </form>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              Leave requests must be submitted at least 1 day in advance. Leave request submission form enabled.
            </div>
          )}
        </div>
      ) : (
        /* HR Queue View */
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-700">Pending Requests Queue ({queue.length})</h4>
          {queue.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No pending late or leave proposals.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Actor #{item.actor_id}</span>
                    <span className="ml-2 text-slate-500 font-mono">{item.new_value?.expected_time}</span>
                    <p className="text-slate-600 mt-0.5">{item.new_value?.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 font-medium">
                      Approve
                    </button>
                    <button className="p-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 font-medium">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
