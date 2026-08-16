import React, { useState, useEffect } from 'react';
import { Kanban, List, Filter, LayoutGrid } from 'lucide-react';
import { useSalesPipeline } from '../../hooks/useSalesPipeline';
import { useToast } from '../../context/ToastContext';
import { SalesPipelineMetrics } from './SalesPipelineMetrics';
import { SalesKanbanBoard } from './SalesKanbanBoard';
import { SalesStageTransitionModal } from './SalesStageTransitionModal';
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
    } catch (err: any) {
      showToast(err.message || 'Failed to update sales stage', 'error');
    }
  };

  const handleModalSubmit = async (reason: string) => {
    if (!transitionState.oppId) return;
    try {
      await updateSalesStage(transitionState.oppId, transitionState.targetStage, reason);
      showToast('Sales stage updated successfully', 'success');
      fetchOpportunities();
      fetchPipelineMetrics();
    } catch (err: any) {
      showToast(err.message || 'Failed to drop sales opportunity', 'error');
    } finally {
      setTransitionState({ isOpen: false, oppId: null, targetStage: '' });
    }
  };

  const handleOpportunityClick = (opp: any) => {
    setSelectedOpportunityId(opp.id);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-500" />
            Property Sales Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage and track property sales opportunities across stages.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md flex items-center transition-all ${
                viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Kanban View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md flex items-center transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <SalesPipelineMetrics metrics={pipelineMetrics} isLoading={isLoading && !pipelineMetrics} />

      {/* Pipeline Content Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {isLoading && opportunities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold">Loading sales pipeline...</span>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          <SalesKanbanBoard 
            opportunities={opportunities} 
            onOpportunityClick={handleOpportunityClick} 
            onStageChange={handleStageChange} 
          />
        ) : (
          <div className="p-4 flex items-center justify-center h-full text-slate-400 italic text-sm">
            [Sales Pipeline List will go here]
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
