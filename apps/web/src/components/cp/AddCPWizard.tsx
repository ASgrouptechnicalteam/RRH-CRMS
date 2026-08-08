import React, { useState } from 'react';
import { 
  Building2, User, Phone, Mail, Award, 
  CheckCircle2, ArrowRight, ArrowLeft, X, Link, 
  ShieldCheck, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';

interface ChannelPartner {
  id: number;
  cp_code: string;
  firm_name: string;
  contact_name: string;
  tier: string;
}

interface AddCPWizardProps {
  onClose: () => void;
  onSuccess: () => void;
  cps: ChannelPartner[];
}

export const AddCPWizard: React.FC<AddCPWizardProps> = ({ onClose, onSuccess, cps }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Basic Info
  const [firmName, setFirmName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Tier & Verification
  const [tier, setTier] = useState<'SILVER' | 'GOLD' | 'PLATINUM'>('SILVER');
  const [reraNumber, setReraNumber] = useState('');

  // Step 3: Hierarchy
  const [uplineCpId, setUplineCpId] = useState('');

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!firmName || !contactName || !phone) {
      showToast('Firm Name, Contact Name, and Phone are required', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/cp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_name: firmName,
          contact_name: contactName,
          phone,
          email,
          tier,
          upline_cp_id: uplineCpId ? parseInt(uplineCpId, 10) : null,
          rera_number: reraNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Channel Partner Registered!', 'success');
        onSuccess();
      } else {
        showToast(data.error || 'Failed to register Channel Partner', 'error');
      }
    } catch (e) {
      showToast('Error connecting to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">Basic Details</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Firm / Agency Name *</label>
                <div className="relative">
                  <Building2 className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type="text" value={firmName} onChange={e => setFirmName(e.target.value)} autoFocus className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold" placeholder="e.g. Royal Realty Networks LLP" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Person *</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold" placeholder="e.g. Rajesh Goud" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono text-lg" placeholder="98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm" placeholder="Optional" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">Tier & Verification</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Commission Tier *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { val: 'SILVER', label: 'Silver', rate: '2.0%', color: 'slate' },
                    { val: 'GOLD', label: 'Gold', rate: '2.5%', color: 'amber' },
                    { val: 'PLATINUM', label: 'Platinum', rate: '3.0%', color: 'indigo' },
                  ].map(t => (
                    <button 
                      key={t.val}
                      onClick={() => setTier(t.val as any)}
                      className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${tier === t.val ? `border-${t.color}-500 bg-${t.color}-50 shadow-md` : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      {tier === t.val && <CheckCircle2 className={`w-5 h-5 absolute top-3 right-3 text-${t.color}-500`} />}
                      <div className={`font-bold text-${t.color}-700 text-lg`}>{t.label}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">Base Rate: {t.rate}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl">
                <label className="block text-xs font-bold text-sky-800 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> RERA Registration (Optional)
                </label>
                <input type="text" value={reraNumber} onChange={e => setReraNumber(e.target.value)} className="w-full p-3 border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-500" placeholder="e.g. P02400001234" />
                <p className="text-[10px] text-sky-600 mt-2">Required for Platinum tier verification in standard flow.</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">Network Hierarchy</h2>
            
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4" /> Link Upline Parent CP
                </label>
                <p className="text-xs text-slate-500 mb-4">
                  If this channel partner was referred by another CP, link them here so the upline receives the 0.5% override commission on all successful deals.
                </p>
                
                <select
                  value={uplineCpId}
                  onChange={(e) => setUplineCpId(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold text-slate-700"
                >
                  <option value="">None (Direct Master CP)</option>
                  {cps.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.firm_name} ({cp.cp_code}) - {cp.tier} Tier
                    </option>
                  ))}
                </select>
              </div>

              {uplineCpId && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Hierarchy Linked!</strong> The selected upline CP will automatically earn a 0.5% override commission whenever {firmName || 'this CP'} closes a deal.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">Review & Confirm</h2>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm space-y-4">
              <div className="grid grid-cols-2 text-sm gap-y-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Firm Name</span>
                  <span className="font-semibold text-slate-800">{firmName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Person</span>
                  <span className="font-semibold text-slate-800">{contactName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                  <span className="font-mono font-semibold text-slate-800">{phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Commission Tier</span>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                    tier === 'PLATINUM' ? 'bg-indigo-100 text-indigo-800' :
                    tier === 'GOLD' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {tier} TIER
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Hierarchy</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {uplineCpId ? `Linked to Upline CP ID: ${uplineCpId}` : 'Direct Master CP (No Upline)'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>
                By registering, you confirm that the agency details are verified. Bank account details are deliberately excluded during initial registration and will be collected directly by Finance during the first payout processing.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-6">
      <div className="w-full h-full md:h-auto md:max-h-[85vh] max-w-3xl bg-white md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 text-amber-700 font-bold">
            <Building2 className="w-5 h-5" />
            <span>Channel Partner Registration</span>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="flex bg-slate-50 border-b border-slate-100 px-6 py-3">
          {[1,2,3,4].map(num => (
            <div key={num} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= num ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {num}
              </div>
              {num < 4 && <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${step > num ? 'bg-amber-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white custom-scrollbar">
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0">
          <button 
            onClick={handleBack} 
            disabled={step === 1}
            className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-0"
          >
            Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={handleNext}
              disabled={step === 1 && (!firmName || !contactName || !phone)}
              className="px-8 py-2.5 bg-amber-600 text-white font-bold rounded-xl shadow-md hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-2.5 bg-amber-700 text-white font-bold text-base rounded-xl shadow-lg hover:bg-amber-800 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Registering...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
