import React, { useState, useEffect } from 'react';
import { Kanban, List, LayoutGrid } from 'lucide-react';
import { useSalesPipeline } from '../../hooks/useSalesPipeline';
import { useToast } from '../../context/ToastContext';
import { SALES_STAGE_LABELS, SALES_STAGE_COLORS } from './SalesConstants';
import { SalesPipelineMetrics } from './SalesPipelineMetrics';
import { SalesKanbanBoard } from './SalesKanbanBoard';
import { SalesStageTransitionModal } from './SalesStageTransitionModal';
import { SalesOpportunity } from '../../types';
import { SalesOpportunityDetails } from './SalesOpportunityDetails';

export const SalesPipelineManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const [transitionState, setTransitionState] = useState<{ isOpen: boolean; oppId: number | null; targetStage: string }>({
    isOpen: false,
    oppId: null,
    targetStage: ''
  });
  const { opportunities, pipelineMetrics, fetchOpportunities, fetchPipelineMetrics, updateSalesStage, isLoading, error } = useSalesPipeline();
  const { showToast } = useToast();

  useEffect(() => {
    fetchOpportunities();
    fetchPipelineMetrics();
  }, [fetchOpportunities, fetchPipelineMetrics]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const handleStageChange = async (opportunityId: number, newStage: string) => {
    if (newStage === 'BOOKED') {
      showToast('Booking transitions are managed in Phase 9 (Transaction Domain).', 'error');
      return;
    }

    if (newStage === 'DROPPED') {
      setTransitionState({ isOpen: true, oppId: opportunityId, targetStage: newStage });
      return;
    }

    try {
      await updateSalesStage(opportunityId, newStage);
      showToast('Sales stage updated successfully', 'success');
      fetchOpportunities();
      fetchPipelineMetrics();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(message || 'Failed to update sales stage', 'error');
    }
  };

  const handleModalSubmit = async (reason: string) => {
    if (!transitionState.oppId) return;
    try {
      await updateSalesStage(transitionState.oppId, transitionState.targetStage, reason);
      showToast('Sales stage updated successfully', 'success');
      fetchOpportunities();
      fetchPipelineMetrics();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(message || 'Failed to drop sales opportunity', 'error');
    } finally {
      setTransitionState({ isOpen: false, oppId: null, targetStage: '' });
    }
  };

  const handleOpportunityClick = (opp: SalesOpportunity) => {
    setSelectedOpportunityId(opp.id);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-navy-500" />
            Property Sales Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage and track property sales opportunities across stages.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              aria-label="Kanban view"
              aria-pressed={viewMode === 'kanban'}
              className={`p-1.5 rounded-md flex items-center transition-all ${
                viewMode === 'kanban' ? 'bg-white shadow-sm text-navy-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Kanban View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`p-1.5 rounded-md flex items-center transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-navy-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <SalesPipelineMetrics metrics={pipelineMetrics ?? {}} isLoading={isLoading && !pipelineMetrics} />

      {/* Pipeline Content Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {isLoading && opportunities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold">Loading sales pipeline...</span>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          <SalesKanbanBoard
            opportunities={opportunities}
            onOpportunityClick={handleOpportunityClick}
            onStageChange={handleStageChange}
          />
        ) : opportunities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No sales opportunities found.
          </div>
        ) : (
          <div className="p-4 max-h-72 md:max-h-96 overflow-y-auto overscroll-contain pr-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th scope="col" className="py-2 px-3">Prospect</th>
                  <th scope="col" className="py-2 px-3">Stage</th>
                  <th scope="col" className="py-2 px-3">Project</th>
                  <th scope="col" className="py-2 px-3">Property</th>
                  <th scope="col" className="py-2 px-3 text-right">Expected Value</th>
                  <th scope="col" className="py-2 px-3 text-right">Probability</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    onClick={() => handleOpportunityClick(opp)}
                    className="border-b border-slate-100 hover:bg-navy-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {opp.lead?.customer_name || 'Unknown Prospect'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SALES_STAGE_COLORS[opp.lead?.status || 'UNKNOWN'] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {SALES_STAGE_LABELS[opp.lead?.status || 'UNKNOWN'] || opp.lead?.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{opp.project?.name || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{opp.property?.title || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                      ₹{(Number(opp.expected_value || 0) / 100000).toFixed(1)}L
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {Number(opp.probability || 0) > 0 ? `${opp.probability}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SalesStageTransitionModal 
        isOpen={transitionState.isOpen}
        targetStage={transitionState.targetStage}
        onClose={() => setTransitionState({ isOpen: false, oppId: null, targetStage: '' })}
        onSubmit={handleModalSubmit}
      />

      {selectedOpportunityId && (
        <SalesOpportunityDetails 
          opportunityId={selectedOpportunityId} 
          onClose={() => setSelectedOpportunityId(null)} 
        />
      )}
    </div>
  );
};
