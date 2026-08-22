import React from 'react';
import { SALES_STAGES_ORDER, SALES_STAGE_LABELS, SALES_STAGE_COLORS } from './SalesConstants';
import { SalesOpportunityCard } from './SalesOpportunityCard';
import { useAuth } from '../../context/AuthContext';
import { Permissions } from '@rrh-ems/shared';

interface SalesKanbanBoardProps {
  opportunities: any[];
  onOpportunityClick: (opp: any) => void;
  onStageChange: (opportunityId: number, newStage: string) => void;
}

export const SalesKanbanBoard: React.FC<SalesKanbanBoardProps> = ({ opportunities, onOpportunityClick, onStageChange }) => {
  const { user } = useAuth();
  const canUpdate = user?.permissions?.includes(Permissions.LEADS_UPDATE);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!canUpdate) return;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.stage !== targetStage) {
        onStageChange(data.id, targetStage);
      }
    } catch (err) {
      console.error('Drop error', err);
    }
  };

  // Group by stage
  const grouped = SALES_STAGES_ORDER.reduce((acc, stage) => {
    acc[stage] = opportunities.filter(o => o.stage === stage);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex h-[calc(100vh-220px)] overflow-x-auto overflow-y-hidden bg-slate-50 rounded-2xl border border-slate-200 p-4 gap-4 no-scrollbar">
      {SALES_STAGES_ORDER.map(stage => {
        const columnOpps = grouped[stage] || [];
        const stageColorClass = SALES_STAGE_COLORS[stage] || 'bg-slate-100 text-slate-700 border-slate-200';
        
        // Calculate total column expected value
        const columnValue = columnOpps.reduce((sum, opp) => sum + Number(opp.expected_value || 0), 0);

        return (
          <div 
            key={stage}
            className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column Header */}
            <div className={`p-3 border-b flex flex-col gap-1.5 ${stageColorClass.replace('text-', 'text-opacity-90 text-')}`}>
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-sm">{SALES_STAGE_LABELS[stage] || stage}</h2>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/50 backdrop-blur-sm">
                  {columnOpps.length}
                </span>
              </div>
              <div className="text-[11px] font-semibold opacity-80">
                ₹{(columnValue / 100000).toFixed(1)}L Expected
              </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 p-2 overflow-y-auto space-y-2 no-scrollbar">
              {columnOpps.map(opp => (
                <SalesOpportunityCard 
                  key={opp.id} 
                  opportunity={opp} 
                  onClick={onOpportunityClick} 
                />
              ))}
              {columnOpps.length === 0 && (
                <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium italic">
                  Drag deals here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
