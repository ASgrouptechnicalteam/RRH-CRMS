import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface RecordPaymentModalProps {
  bookingId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ bookingId, onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'CASH',
    reference_number: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          booking_id: bookingId,
          amount: parseFloat(formData.amount),
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || undefined,
          notes: formData.notes,
        })
      });

      if (res.ok) {
        showToast('Payment recorded successfully. It is pending verification.', 'success');
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to record payment', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Record Payment</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              min="1"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              placeholder="e.g. 50000"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={e => setFormData({...formData, payment_method: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online/UPI</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reference Number</label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={e => setFormData({...formData, reference_number: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              placeholder="Cheque No. or UTR"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              rows={2}
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-navy-600 hover:bg-navy-700 rounded-lg disabled:opacity-50">
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
