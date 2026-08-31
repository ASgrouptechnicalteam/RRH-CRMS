import React, { useState } from 'react';
import { ShieldCheck, ServerCrash, Users, Webhook, Plug, Settings, Send } from 'lucide-react';
import { MDControlDashboard } from '../md/MDControlDashboard';
import { AdminAnalyticsPortal } from '../admin/AdminAnalyticsPortal';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { BannerControlWidget } from '../dashboards/BannerControlWidget';
import { Roles } from '@rrh-ems/shared';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { handleApiError, toUserFacingError } from '../../utils/userFacingError';

export const SystemControlHub: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast , showError } = useToast();
  
  const isMD = user?.roles?.includes(Roles.MD);
  const isAdmin = user?.roles?.includes(Roles.ADMIN);

  const [activeTab, setActiveTab] = useState<'roles' | 'webhooks' | 'integrations' | 'advanced'>('integrations');

  // Simulate Lead state
  const [simName, setSimName] = useState('Jane Doe');
  const [simPhone, setSimPhone] = useState('9876543210');
  const [simSource, setSimSource] = useState('FACEBOOK');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isMD && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSimulateLead = async () => {
    setIsSimulating(true);
    try {
      const payload = {
        name: simName,
        phone: simPhone,
        source: simSource,
        email: `${simName.toLowerCase().replace(' ', '.')}@example.com`,
        budget: 5000000,
      };

      // In a real scenario, this hits the webhook/incoming leads endpoint
      const res = await fetchWithAuth(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Lead webhook simulated successfully. Check the Leads pipeline.', 'success');
      } else {
        showError({ message: 'Failed to simulate lead.' });
      }
    } catch (e) {
      showError(toUserFacingError({ message: e instanceof Error ? e.message : String(e), body: e })); } finally {
      setIsSimulating(false);
    }
  };

  const getPayloadPreview = () => {
    return JSON.stringify({
      name: simName,
      phone: simPhone,
      source: simSource,
      email: `${simName.toLowerCase().replace(' ', '.')}@example.com`,
      budget: 5000000,
    }, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-navy-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-gold-500" />
            <h1 className="text-xl font-extrabold tracking-tight">System Control Center</h1>
          </div>
          <p className="text-xs text-navy-200/80">
            High-security administration portal for roles, webhooks, and integrations.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar gap-1 p-2 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'roles' 
                ? 'bg-white text-navy-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            Roles & Permissions
          </button>
          
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'webhooks' 
                ? 'bg-white text-navy-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Webhook className="w-4 h-4" />
            Webhooks
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'integrations' 
                ? 'bg-white text-navy-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Plug className="w-4 h-4" />
            Integrations
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'advanced' 
                ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-200' 
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Settings className="w-4 h-4" />
            Advanced
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'roles' && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">Roles Management</h3>
              <p className="text-sm text-slate-500">Fine-grained RBAC configuration coming soon.</p>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="text-center py-12">
              <Webhook className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">Webhook Subscriptions</h3>
              <p className="text-sm text-slate-500">Configure outbound webhooks to third-party services.</p>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Lead Integrations</h3>
                <p className="text-sm text-slate-500">Manage incoming lead sources (Facebook, Housing.com, 99acres).</p>
              </div>

              {/* Simulate Lead Tool */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 p-4">
                  <h4 className="font-bold text-navy-800 flex items-center gap-2">
                    <ServerCrash className="w-4 h-4" />
                    Simulate Lead (Debug Tool)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fire a mock webhook to test the CRM lead parsing pipeline.
                  </p>
                </div>
                
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                      <input 
                        type="text" 
                        value={simName}
                        onChange={(e) => setSimName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-navy-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={simPhone}
                        onChange={(e) => setSimPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-navy-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Source</label>
                      <select
                        value={simSource}
                        onChange={(e) => setSimSource(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-navy-500"
                      >
                        <option value="FACEBOOK">Facebook Lead Ads</option>
                        <option value="HOUSING.COM">Housing.com</option>
                        <option value="99ACRES">99acres</option>
                        <option value="WEBSITE">Direct Website</option>
                      </select>
                    </div>
                    <button
                      onClick={handleSimulateLead}
                      disabled={isSimulating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-navy-700 text-white rounded-xl text-sm font-bold hover:bg-navy-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {isSimulating ? 'Firing Webhook...' : 'Fire Webhook'}
                    </button>
                  </div>

                  {/* Payload Preview */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Generated JSON Payload</label>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto font-mono h-48 border border-slate-800">
                      {getPayloadPreview()}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {isMD && <MDControlDashboard />}
              {isAdmin && <AdminAnalyticsPortal />}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BannerControlWidget />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
