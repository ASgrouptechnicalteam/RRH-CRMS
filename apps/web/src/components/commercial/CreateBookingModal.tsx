import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { X, Building } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface CreateBookingModalProps {
  customerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ customerId, onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    property_id: '',
    agreed_price: '',
    booking_amount: '',
    notes: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties?status=LIVE`);
      if (res.ok) {
        const data = await res.json();
        // Assume data returns an array or an object with properties
        const props = Array.isArray(data) ? data : data.properties || [];
        setProperties(props);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          property_id: parseInt(formData.property_id, 10),
          agreed_price: parseFloat(formData.agreed_price),
          booking_amount: parseFloat(formData.booking_amount),
          notes: formData.notes,
        })
      });

      if (res.ok) {
        showToast('Booking created successfully.', 'success');
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create booking', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-600" />
            Create Booking
          </h3>
          <button onClick={onClose} aria-label="Close create booking dialog" className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Property</label>
            <select
              required
              value={formData.property_id}
              onChange={e => setFormData({...formData, property_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="" disabled>-- Select a LIVE property --</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title} (₹{p.price?.toLocaleString() || 'N/A'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Agreed Price (₹)</label>
            <input
              type="number"
              required
              min="1"
              value={formData.agreed_price}
              onChange={e => setFormData({...formData, agreed_price: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Token/Booking Amount (₹)</label>
            <input
              type="number"
              required
              min="1"
              value={formData.booking_amount}
              onChange={e => setFormData({...formData, booking_amount: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={2}
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading || !formData.property_id} className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50">
              {loading ? 'Creating...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
