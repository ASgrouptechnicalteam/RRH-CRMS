import React, { useState } from 'react';
import { Building, MapPin, IndianRupee, Clock, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';
import { PROPERTY_TYPE_OPTIONS } from '../../constants/propertyTypes';
import { toUserFacingError } from '../../utils/userFacingError';

interface QualifyLeadModalProps {
  leadId: number;
  currentData: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const QualifyLeadModal: React.FC<QualifyLeadModalProps> = ({ leadId, currentData, onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [propertyType, setPropertyType] = useState(currentData?.property_type_preference || 'RESIDENTIAL_APARTMENT');
  const [preferredLocation, setPreferredLocation] = useState(currentData?.preferred_location || '');
  const [budgetMin, setBudgetMin] = useState(currentData?.budget_min ? currentData.budget_min.toString() : '');
  const [budgetMax, setBudgetMax] = useState(currentData?.budget_max ? currentData.budget_max.toString() : '');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_type_preference: propertyType,
          preferred_location: preferredLocation,
          budget_min: budgetMin ? parseInt(budgetMin, 10) : null,
          budget_max: budgetMax ? parseInt(budgetMax, 10) : null,
          notes: notes ? (currentData?.notes ? `${currentData.notes}\n\n[Qualification Notes]\n${notes}` : `[Qualification Notes]\n${notes}`) : undefined
        }),
      });

      if (res.ok) {
        showToast('Lead qualified successfully', 'success');
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        const formatted = toUserFacingError({ status: res.status, body: data });
        showToast({ ...formatted, type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      const formatted = toUserFacingError({ message: err.message });
      showToast({ ...formatted, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Qualify Lead</h2>
            <p className="text-sm text-slate-500 mt-1">Record detailed requirements.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building className="w-4 h-4 text-navy-500" />
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all appearance-none"
              >
                <option value="">Select property type...</option>
                {PROPERTY_TYPE_OPTIONS.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
                {/* Support legacy/unknown values if they are already set in DB */}
                {propertyType && !PROPERTY_TYPE_OPTIONS.find(pt => pt.value === propertyType) && (
                  <option value={propertyType}>{propertyType}</option>
                )}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-navy-500" />
                Preferred Location
              </label>
              <input
                type="text"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                placeholder="e.g. Kondapur"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-navy-500" />
                Min Budget (₹)
              </label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="e.g. 5000000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-navy-500" />
                Max Budget (₹)
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="e.g. 15000000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-navy-500" />
                Additional Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Timeline, loan requirements, specific BHK preference..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none"
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save Qualification'}
          </button>
        </div>
      </div>
    </div>
  );
};
