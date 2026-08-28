import React, { useState, useEffect } from 'react';
import { X, Building, MapPin, DollarSign, Clock, Target, CalendarDays, CheckSquare, History } from 'lucide-react';
import { useSalesPipeline } from '../../hooks/useSalesPipeline';
import { SALES_STAGE_LABELS, SALES_STAGE_COLORS } from './SalesConstants';
import { SalesOpportunityData, OpportunityHistoryEntry } from '../../types';

interface SalesOpportunityDetailsProps {
  opportunityId: number;
  onClose: () => void;
}

export const SalesOpportunityDetails: React.FC<SalesOpportunityDetailsProps> = ({ opportunityId, onClose }) => {
  const { getSalesOpportunityDetails } = useSalesPipeline();
  const [opportunity, setOpportunity] = useState<SalesOpportunityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'journey' | 'tasks' | 'visits'>('journey');

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getSalesOpportunityDetails(opportunityId);
        if (isMounted) setOpportunity(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchDetails();
    return () => { isMounted = false; };
  }, [opportunityId, getSalesOpportunityDetails]);

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-white shadow-2xl z-50 flex items-center justify-center border-l border-slate-200">
        <div className="w-8 h-8 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!opportunity) return null;

  const expectedValue = Number(opportunity.expected_value || 0);
  const probability = Number(opportunity.probability || 0);
  const stageColorClass = SALES_STAGE_COLORS[opportunity.stage] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
      <div className="w-full sm:w-[500px] md:w-[600px] bg-slate-50 shadow-2xl flex flex-col h-full animate-slideInRight border-l border-slate-200">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-800">Sales Details</h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                #{opportunity.id}
              </span>
            </div>
            <div className={`text-xs font-bold px-2 py-0.5 rounded border inline-flex ${stageColorClass}`}>
              {SALES_STAGE_LABELS[opportunity.stage] || opportunity.stage}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close sales details" className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Expected Value</p>
                <p className="font-black text-slate-800">₹{(expectedValue / 100000).toFixed(1)}L</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-navy-100 text-navy-600 rounded-lg"><Target className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Probability</p>
                <p className="font-black text-slate-800">{probability}%</p>
              </div>
            </div>
          </div>

          {/* Context Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 mb-3">Context</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500">Prospect</p>
                <p className="font-medium text-slate-800">{opportunity.lead?.customer_name || 'N/A'}</p>
                <p className="text-xs text-slate-500">{opportunity.lead?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Sales Exec</p>
                <p className="font-medium text-slate-800">{opportunity.owner?.full_name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Project</p>
                <div className="flex items-center gap-1 font-medium text-slate-800">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {opportunity.project?.name || 'N/A'}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Property</p>
                <div className="flex items-center gap-1 font-medium text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {opportunity.property?.title || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('journey')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'journey' ? 'border-navy-600 text-navy-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-4 h-4" /> Sales Journey
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'tasks' ? 'border-navy-600 text-navy-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Tasks
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'visits' ? 'border-navy-600 text-navy-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Site Visits
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[300px]">
            {activeTab === 'journey' && (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {opportunity.history?.length > 0 ? (
                  opportunity.history.map((hist: OpportunityHistoryEntry, index: number) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-800 text-xs">
                            {SALES_STAGE_LABELS[hist.to_stage] || hist.to_stage}
                          </div>
                          <time className="text-[10px] text-slate-400 font-medium">
                            {new Date(hist.created_at).toLocaleDateString()}
                          </time>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {hist.duration_minutes ? `Time in stage: ${Math.round(hist.duration_minutes / 60 / 24)} days` : 'Current Stage'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 text-sm italic py-8">No journey history available.</p>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="text-center text-slate-400 text-sm italic py-8">
                Task list integration pending phase sync.
              </div>
            )}

            {activeTab === 'visits' && (
              <div className="text-center text-slate-400 text-sm italic py-8">
                Site Visit integration pending phase sync.
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
