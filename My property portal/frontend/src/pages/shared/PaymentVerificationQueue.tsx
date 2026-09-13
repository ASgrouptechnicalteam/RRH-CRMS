import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';

const PaymentVerificationQueue = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchQueue = async () => {
    try {
      const res = await axios.get('/payments/queue');
      setQueue(res.data);
    } catch (error) {
      console.error('Failed to fetch verification queue', error);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleVerify = async () => {
    if (!decision || !selectedPayment) return;
    if (decision === 'Rejected' && !rejectionReason.trim()) {
      alert('Rejection reason is required.');
      return;
    }

    try {
      await axios.put(`/payments/${selectedPayment.id}/verify`, {
        decision,
        rejectionReason: decision === 'Rejected' ? rejectionReason : undefined,
        remarks,
      });
      setSelectedPayment(null);
      setDecision(null);
      setRejectionReason('');
      setRemarks('');
      fetchQueue(); // Refresh queue
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error verifying payment');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">Payment Verifications</h2>
        <p className="text-slate-400">Review and verify external payments entered by DEMs.</p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4 opacity-50" />
            <p>No pending payments require verification.</p>
          </div>
        ) : (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Customer & Property</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Method / Ref</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {queue.map((payment) => {
                const property = payment.installment?.emiSchedule?.property;
                return (
                  <tr key={payment.id} className="hover:bg-slate-700/20">
                    <td className="p-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <p className="font-medium text-slate-200">{property?.customer?.name}</p>
                      <p className="text-xs text-slate-400">
                        {property?.project?.name} • {property?.propertyNumber}
                      </p>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <p className="text-slate-200">{payment.paymentMethod}</p>
                      <p className="text-xs text-slate-400">{payment.referenceNumber}</p>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 font-medium text-sm transition"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Verification Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Verify Payment</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Customer</p>
                <p className="text-white font-medium">
                  {selectedPayment.installment?.emiSchedule?.property?.customer?.name}
                </p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Amount</p>
                <p className="text-white font-bold text-lg">
                  ₹{selectedPayment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Method / Ref</p>
                <p className="text-white">
                  {selectedPayment.paymentMethod} • {selectedPayment.referenceNumber}
                </p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Payment Proof</p>
                <a
                  href={selectedPayment.paymentProof?.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <FileText size={16} /> View Document
                </a>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
              <p className="text-slate-300 font-medium mb-3">Decision</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="decision"
                    value="Approved"
                    checked={decision === 'Approved'}
                    onChange={() => setDecision('Approved')}
                    className="text-emerald-500"
                  />
                  Approve Payment
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="decision"
                    value="Rejected"
                    checked={decision === 'Rejected'}
                    onChange={() => setDecision('Rejected')}
                    className="text-red-500"
                  />
                  Reject Payment
                </label>
              </div>
            </div>

            {decision === 'Rejected' && (
              <div className="mb-6">
                <label className="block text-slate-300 font-medium mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-red-500"
                  placeholder="Explain why this payment is being rejected..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={!decision || (decision === 'Rejected' && !rejectionReason.trim())}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Confirm {decision || ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationQueue;
