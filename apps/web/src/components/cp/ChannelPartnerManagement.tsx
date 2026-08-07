import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  ShieldCheck,
  Plus,
  Search,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Lock,
  ChevronRight,
  TrendingUp,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';

interface ChannelPartner {
  id: number;
  cp_code: string;
  firm_name: string;
  contact_name: string;
  phone: string;
  email?: string;
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
  upline_cp_id?: number;
  upline_cp?: { id: number; cp_code: string; firm_name: string; contact_name: string };
  rera_number?: string;
  status: string;
  totalEarned: number;
  pendingAmount: number;
  activeProtectedLeads: number;
}

interface CPPayout {
  id: number;
  payout_code: string;
  cp: { id: number; cp_code: string; firm_name: string; contact_name: string; tier: string };
  deal_amount: number;
  tier_rate_percent: number;
  commission_amount: number;
  level: number; // 1 = Direct CP, 2 = Upline Override
  status: 'PENDING_MD_APPROVAL' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  notes?: string;
  approved_by?: { id: number; employee_code?: string; full_name: string };
}

export const ChannelPartnerManagement: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const [cps, setCps] = useState<ChannelPartner[]>([]);
  const [payouts, setPayouts] = useState<CPPayout[]>([]);
  const [activeTab, setActiveTab] = useState<'NETWORK' | 'LEDGER'>('NETWORK');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);

  // Register Form State
  const [firmName, setFirmName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<'SILVER' | 'GOLD' | 'PLATINUM'>('SILVER');
  const [uplineCpId, setUplineCpId] = useState<string>('');
  const [reraNumber, setReraNumber] = useState('');

  // Calculate Form State
  const [selectedCpId, setSelectedCpId] = useState<string>('');
  const [dealAmount, setDealAmount] = useState('18500000');

  // Submitting State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMD = user?.roles?.some((r) => ['MD', 'Admin (Technical)'].includes(r));

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/cp`);
      const data = await res.json();
      if (res.ok) {
        setCps(data.channelPartners || []);
      }

      const poRes = await fetchWithAuth(`${API_BASE_URL}/cp/payouts`);
      const poData = await poRes.json();
      if (poRes.ok) {
        setPayouts(poData.payouts || []);
      }
    } catch (e) {
      console.error('Fetch CP data error:', e);
      showToast('Failed to load Channel Partner network', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterCP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName || !contactName || !phone) return;

    setIsSubmitting(true);
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
        showToast(data.message, 'success');
        setShowRegisterModal(false);
        setFirmName('');
        setContactName('');
        setPhone('');
        fetchData();
      } else {
        showToast(data.error || 'Failed to register Channel Partner', 'error');
      }
    } catch (err) {
      showToast('Error registering Channel Partner', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCalculateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCpId || !dealAmount) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/cp/calculate-commission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cp_id: parseInt(selectedCpId, 10),
          deal_amount: parseFloat(dealAmount),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setShowCalculateModal(false);
        setActiveTab('LEDGER');
        fetchData();
      } else {
        showToast(data.error || 'Failed to calculate commission', 'error');
      }
    } catch (err) {
      showToast('Error calculating commission', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovePayout = async (payoutId: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/cp/payouts/${payoutId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        fetchData();
      } else {
        showToast(data.error || 'Failed to approve payout', 'error');
      }
    } catch (err) {
      showToast('Error approving payout', 'error');
    }
  };

  const filteredCPs = cps.filter(
    (cp) =>
      cp.cp_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cp.firm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cp.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'GOLD':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-teal-950 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-amber-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Channel Partner Network & Incentive Engine</h2>
          </div>
          <p className="text-xs text-amber-200/80">
            2-Level Hierarchical MLM Commissions (Silver 2.0% | Gold 2.5% | Platinum 3.0% + 0.5% Upline Override) + 60-Day Anti-Poaching Lock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCalculateModal(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shadow"
          >
            <DollarSign className="w-4 h-4 text-amber-300" />
            <span>Calculate Deal Commission</span>
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register Channel Partner</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('NETWORK')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'NETWORK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            CP Directory ({cps.length})
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'LEDGER' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-300" />
            <span>Commission Ledger ({payouts.length})</span>
          </button>
        </div>

        {activeTab === 'NETWORK' && (
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search CP code, firm, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        )}
      </div>

      {/* View 1: Channel Partner Directory */}
      {activeTab === 'NETWORK' && (
        <>
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading Channel Partner directory...</div>
          ) : filteredCPs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No Channel Partners registered yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCPs.map((cp) => (
                <div
                  key={cp.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-900 text-xs">{cp.cp_code}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getTierBadge(cp.tier)}`}>
                        {cp.tier} TIER ({cp.tier === 'PLATINUM' ? '3.0%' : cp.tier === 'GOLD' ? '2.5%' : '2.0%'})
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{cp.firm_name}</h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        {cp.contact_name} ({cp.phone})
                      </p>
                    </div>

                    {cp.upline_cp && (
                      <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-200/60 text-[11px]">
                        <span className="text-amber-800 font-bold">Upline Parent CP:</span>{' '}
                        <span className="text-slate-700 font-semibold">{cp.upline_cp.firm_name} ({cp.upline_cp.cp_code})</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Earned</span>
                      <span className="font-bold text-emerald-700">₹{(cp.totalEarned / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending</span>
                      <span className="font-bold text-amber-700">₹{(cp.pendingAmount / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Protected</span>
                      <span className="font-bold text-sky-700 flex items-center justify-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        {cp.activeProtectedLeads}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* View 2: Commission Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Hierarchical Commission Ledger</h3>
              <p className="text-xs text-slate-500">Includes Level 1 Direct Commissions & Level 2 Upline Overrides requiring MD Approval</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Payout Code</th>
                  <th className="p-3.5">Channel Partner</th>
                  <th className="p-3.5">Commission Level</th>
                  <th className="p-3.5">Deal Amount</th>
                  <th className="p-3.5">Tier Rate</th>
                  <th className="p-3.5">Commission Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-3.5 font-mono font-bold text-amber-900">{po.payout_code}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{po.cp?.firm_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{po.cp?.cp_code} • {po.cp?.contact_name}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${po.level === 1 ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'}`}>
                        Level {po.level} {po.level === 1 ? 'Direct' : 'Upline Override'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">₹{(po.deal_amount / 100000).toFixed(2)} Lakhs</td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">{po.tier_rate_percent}%</td>
                    <td className="p-3.5 font-black text-emerald-900 text-sm">₹{po.commission_amount.toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${po.status === 'DISBURSED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {po.status === 'PENDING_MD_APPROVAL' && isMD ? (
                        <button
                          onClick={() => handleApprovePayout(po.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] rounded-xl shadow"
                        >
                          Approve & Disburse
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {po.approved_by ? `Approved by ${po.approved_by.full_name}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register CP Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-800 text-lg mb-1">Register New Channel Partner</h3>
            <p className="text-xs text-slate-500 mb-4">Add new Channel Partner with tiering and optional Upline parent CP link</p>

            <form onSubmit={handleRegisterCP} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Firm / Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Realty Networks LLP"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Goud"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98888 77777"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Commission Tier *</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 font-bold text-slate-700"
                  >
                    <option value="SILVER">Silver (2.0% Base Rate)</option>
                    <option value="GOLD">Gold (2.5% Rate)</option>
                    <option value="PLATINUM">Platinum (3.0% Top Rate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Upline Parent CP</label>
                  <select
                    value={uplineCpId}
                    onChange={(e) => setUplineCpId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 font-semibold text-slate-700"
                  >
                    <option value="">None (Direct Master CP)</option>
                    {cps.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.firm_name} ({cp.cp_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">RERA Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. P02400001234"
                  value={reraNumber}
                  onChange={(e) => setReraNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Registering...' : 'Register Channel Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calculate Deal Commission Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowCalculateModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-800 text-lg mb-1">Calculate Deal Commission</h3>
            <p className="text-xs text-slate-500 mb-4">Calculates Level 1 Direct CP commission + Level 2 Upline 0.5% override</p>

            <form onSubmit={handleCalculateCommission} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Select Channel Partner *</label>
                <select
                  required
                  value={selectedCpId}
                  onChange={(e) => setSelectedCpId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 font-bold text-slate-700"
                >
                  <option value="">Select Channel Partner</option>
                  {cps.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.firm_name} ({cp.tier} Tier @ {cp.tier === 'PLATINUM' ? '3.0%' : cp.tier === 'GOLD' ? '2.5%' : '2.0%'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Closed Deal Value (₹ INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="18500000"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 font-black text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCalculateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Calculating...' : 'Generate Commission Entries'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
