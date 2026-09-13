import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { LEAD_EXIT_REASON_LABELS } from '../../shared';

interface DropLeadModalProps {
  onClose: () => void;
  onConfirm: (exitReason: string, exitReasonDetail: string) => Promise<void>;
}

// Was a plain window.prompt() whose free-text answer never actually reached
// the server as `exit_reason` (it went into `notes` instead) — the server
// requires a non-empty `exit_reason` for any DROPPED transition, so drops
// from that flow were likely rejected outright. This is the real fix: a
// dropdown of the actual reason enum, with a required free-text field only
// when "Other" is picked.
export const DropLeadModal: React.FC<DropLeadModalProps> = ({ onClose, onConfirm }) => {
  const [exitReason, setExitReason] = useState('');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isOther = exitReason === 'OTHER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitReason) {
      setError('Please select a reason.');
      return;
    }
    if (isOther && !detail.trim()) {
      setError('Please specify the reason.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(exitReason, detail.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Drop Lead</h2>
              <p className="text-sm text-slate-500 mt-1">Tell us why so we can track it.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Reason for dropping *</label>
            <select
              value={exitReason}
              onChange={(e) => {
                setExitReason(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none"
              autoFocus
            >
              <option value="">Select a reason...</option>
              {Object.entries(LEAD_EXIT_REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {isOther && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Please specify *</label>
              <textarea
                rows={3}
                value={detail}
                onChange={(e) => {
                  setDetail(e.target.value);
                  setError('');
                }}
                placeholder="What actually happened with this lead?"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                autoFocus
              />
            </div>
          )}

          {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
        </form>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Dropping...' : 'Drop Lead'}
          </button>
        </div>
      </div>
    </div>
  );
};
