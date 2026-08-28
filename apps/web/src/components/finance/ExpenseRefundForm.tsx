/**
 * ExpenseRefundForm.tsx
 * 
 * Modal form for any employee to submit a petty cash reimbursement request.
 * Accepts: Purpose (text), Amount (number), Proof image/PDF upload.
 */

import React, { useState, useRef } from 'react';
import { X, Upload, IndianRupee, FileText, ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseRefundForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    setFile(selected);
    setError(null);
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!purpose.trim()) return setError('Please describe the purpose of the expense.');
    if (!amount || parseFloat(amount) <= 0) return setError('Please enter a valid amount.');

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('purpose', purpose.trim());
      formData.append('amount', amount);
      if (file) formData.append('proof_image', file);

      const res = await fetchWithAuth(`${API_BASE_URL}/expense-refunds`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type; browser sets it with boundary for FormData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-700 to-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Expense Reimbursement</h2>
              <p className="text-navy-200 text-xs">Submit your petty cash refund request</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-navy-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-lg">Request Submitted!</p>
              <p className="text-slate-500 text-sm mt-1">The Finance team will review your request shortly.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Purpose */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Purpose / Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                placeholder="e.g. Purchased printer cartridges for the office, Travel expenses for client visit..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
            </div>

            {/* Proof Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Bill / Receipt Proof <span className="text-slate-400">(optional but recommended)</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="border border-navy-200 rounded-xl bg-navy-50 p-3 flex items-center gap-3">
                  {preview ? (
                    <img src={preview} alt="Bill preview" className="w-14 h-14 rounded-lg object-cover border border-navy-200 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-navy-100 flex items-center justify-center shrink-0">
                      <FileText className="w-7 h-7 text-navy-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl py-5 flex flex-col items-center gap-2 text-slate-400 hover:border-navy-400 hover:text-navy-600 transition-colors group"
                >
                  <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Click to upload bill/receipt</span>
                  <span className="text-[11px]">JPG, PNG, WebP, PDF · Max 5MB</span>
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-navy-700 text-white text-sm font-bold hover:bg-navy-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>
                ) : (
                  <>Submit Request</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
