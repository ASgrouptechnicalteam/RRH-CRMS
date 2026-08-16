import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface SalesStageTransitionModalProps {
  isOpen: boolean;
  targetStage: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const SalesStageTransitionModal: React.FC<SalesStageTransitionModalProps> = ({ isOpen, targetStage, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason.trim());
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scaleUp">
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-slate-800">Drop Sales Opportunity</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Reason for Dropping <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Please provide a specific reason why this sales opportunity is being dropped.
            </p>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors min-h-[100px]"
              placeholder="e.g. Budget constraints, chose competitor, unresponsive..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
            >
              Confirm Drop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
