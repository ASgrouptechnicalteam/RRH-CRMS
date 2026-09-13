import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { AlertCircle, UploadCloud, CheckCircle2, Loader2, Search } from 'lucide-react';

export const DEMPaymentEntry = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [installmentId, setInstallmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api
      .get('/md/customers')
      .catch(() => {})
      .then((res: any) => {
        if (res?.data) setCustomers(res.data);
      });
  }, []);

  const handleCustomerChange = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedPropertyId('');
    setInstallmentId('');
    setInstallments([]);
    setProperties([]);
    if (!customerId) return;
    try {
      const res = await api.get(`/md/customers/${customerId}/360`);
      setProperties(res.data.bookings || []);
    } catch {}
  };

  const handlePropertyChange = async (bookingId: string) => {
    setSelectedPropertyId(bookingId);
    setInstallmentId('');
    setInstallments([]);
    if (!bookingId) return;
    // Load installments for this booking
    try {
      const res = await api.get(`/dem/payments/installment/${bookingId}`);
      // This returns payment history — instead we need installments
      // Use customer financials approach
    } catch {}
    // Fallback: show installment ID field manually
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installmentId.trim()) {
      setMessage({ type: 'error', text: 'Installment ID is required.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // 1. Log Payment — correct endpoint is POST /dem/payments
      const paymentRes = await api.post('/dem/payments', {
        installmentId: installmentId.trim(),
        amount: parseFloat(amount),
        paymentMethod,
        referenceNumber,
        date,
      });

      // 2. Upload Proof — multipart file upload
      if (proofFile) {
        const formData = new FormData();
        formData.append('file', proofFile);
        formData.append('paymentId', paymentRes.data.id);
        formData.append('notes', 'Uploaded via DEM Payment Entry');
        await api.post('/dem/payments/proof', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setMessage({
        type: 'success',
        text: 'Payment successfully logged as PENDING VERIFICATION. PM has been notified.',
      });
      setInstallmentId('');
      setAmount('');
      setReferenceNumber('');
      setProofFile(null);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to log payment.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
          DEM Portal / Payments
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Manual Payment Ingestion</h1>
        <p className="text-slate-500 text-sm mt-1">
          Log external/offline payments received from customers.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-amber-800 font-semibold text-sm">Strict Compliance Notice</h4>
          <p className="text-amber-700 text-xs mt-1 leading-relaxed">
            This form is ONLY for logging payments that have already occurred externally. No
            real-time transactions are processed here. All submissions are set to{' '}
            <strong>Pending Verification</strong> and will not affect customer balances until
            authorized managers approve them.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5"
      >
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Installment ID <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={installmentId}
              onChange={(e) => setInstallmentId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Paste the Installment UUID from the customer's EMI schedule"
            />
            <p className="text-xs text-slate-400 mt-1">Find this in Customer 360 → EMI Schedule</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Amount Received (₹) <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option>Bank Transfer</option>
              <option>UPI</option>
              <option>Cheque</option>
              <option>Cash</option>
              <option>NEFT</option>
              <option>RTGS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reference / UTR Number <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="UTR / Transaction ID / Cheque No."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Payment Proof Document{' '}
            <span className="text-slate-400 text-xs font-normal">(Optional but recommended)</span>
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-300 transition-colors">
            <input
              type="file"
              id="proof-file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="proof-file" className="cursor-pointer">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {proofFile ? (
                <p className="text-sm text-blue-700 font-medium">{proofFile.name}</p>
              ) : (
                <>
                  <p className="text-sm text-slate-600 font-medium">Click to upload proof</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF — max 10MB</p>
                </>
              )}
            </label>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Logging Payment...' : 'Submit to Pending Verification'}
        </button>
      </form>
    </div>
  );
};
