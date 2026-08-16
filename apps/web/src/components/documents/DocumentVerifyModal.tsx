import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';

interface Props {
  documentId: number;
  documentCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentVerifyModal: React.FC<Props> = ({ documentId, documentCode, onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();

  const [decision, setDecision] = useState<'VERIFIED' | 'REJECTED' | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!decision) {
      setError('Please select a decision.');
      return;
    }
    if (decision === 'REJECTED' && !notes.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/documents/${documentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision, notes: notes.trim() || undefined }),
      });

      if (res.ok) {
        showToast(`Document ${decision.toLowerCase()} successfully.`, 'success');
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to verify document.');
      }
    } catch {
      showToast('An error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Verify Document
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Document: <span className="font-mono font-bold text-teal-900">{documentCode}</span>
        </p>

        {/* Decision */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Decision *</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDecision('VERIFIED')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                decision === 'VERIFIED'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-600 hover:border-green-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-1.5" />
              Verified
            </button>
            <button
              type="button"
              onClick={() => setDecision('REJECTED')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                decision === 'REJECTED'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 text-slate-600 hover:border-red-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              Rejected
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Notes {decision === 'REJECTED' ? '*' : '(optional)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setError(''); }}
            placeholder={decision === 'REJECTED' ? 'Provide a reason for rejection...' : 'Optional notes'}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
          {decision === 'REJECTED' && !notes.trim() && (
            <p className="text-xs text-red-500 mt-1">Please provide a reason for rejection.</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !decision}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              decision === 'VERIFIED'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : decision === 'REJECTED'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-300 text-slate-500'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Decision'}
          </button>
        </div>
      </div>
    </div>
  );
};
