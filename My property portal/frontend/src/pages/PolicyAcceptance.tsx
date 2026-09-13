import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
// import api from '../lib/axios';

export const PolicyAcceptance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAgree = async () => {
    setLoading(true);
    try {
      // await api.post('/customers/accept-policy', { version: '1.0' });
      // Mocking for now as the customer policy endpoint is in a future phase
      navigate('/customer/home');
    } catch (error) {
      console.error('Failed to accept policy', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="bg-blue-600 p-6 flex flex-col items-center justify-center text-center">
          <div className="bg-white/20 p-3 rounded-full mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Customer Policies & Responsibilities</h1>
        </div>

        <div className="p-8">
          <div className="prose prose-invert max-w-none text-slate-300 h-64 overflow-y-auto mb-8 pr-4 custom-scrollbar space-y-4">
            <p>Welcome to My Property Portal.</p>
            <p>By using this platform, you agree to the following terms and responsibilities:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Payments:</strong> All payments must be made externally through authorized
                company channels (Bank transfer, UPI, Cheque, Cash). You cannot pay through this
                portal.
              </li>
              <li>
                <strong>Verification:</strong> Uploaded payment proofs are subject to verification.
                Only approved payments will reflect in your financial records.
              </li>
              <li>
                <strong>Accuracy:</strong> Ensure all provided information and documents are
                accurate and up-to-date.
              </li>
              <li>
                <strong>Confidentiality:</strong> Keep your login credentials secure. You are
                responsible for all activities under your account.
              </li>
            </ol>
            <p>Please review these terms carefully before proceeding.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-end border-t border-slate-700 pt-6">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-2.5 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAgree}
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition-colors focus:ring-4 focus:ring-blue-500/50"
            >
              {loading ? 'Processing...' : 'I Agree'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
