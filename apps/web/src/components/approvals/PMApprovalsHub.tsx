import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { PMBlindApprovalQueue } from '../siteVisits/PMBlindApprovalQueue';
import { PMDemoApprovalQueue } from '../demos/PMDemoApprovalQueue';

type ApprovalTab = 'site-visits' | 'demos';

// Site Visit Approvals and Demo Approvals are structurally the same thing —
// an incoming-request queue a PM accepts, routes, or declines — and used to
// live as two separate sidebar entries/pages. Combined here into one page
// with two tabs. The old routes (/pm/site-visits/approvals,
// /pm/demos/approvals) still render this same component so existing
// dashboard deep-links keep working; they just preselect the matching tab.
export const PMApprovalsHub: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ApprovalTab>(
    location.pathname === '/pm/demos/approvals' ? 'demos' : 'site-visits',
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('site-visits')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'site-visits'
              ? 'border-navy-600 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Site Visits
        </button>
        <button
          onClick={() => setActiveTab('demos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'demos'
              ? 'border-navy-600 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Demos
        </button>
      </div>

      {activeTab === 'site-visits' ? <PMBlindApprovalQueue /> : <PMDemoApprovalQueue />}
    </div>
  );
};
