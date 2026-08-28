import React from 'react';
import { User, Building, MapPin, DollarSign, Clock } from 'lucide-react';
import { SalesOpportunity } from '../../types';

interface SalesOpportunityCardProps {
  opportunity: SalesOpportunity;
  onClick: (opp: SalesOpportunity) => void;
}

export const SalesOpportunityCard: React.FC<SalesOpportunityCardProps> = ({ opportunity, onClick }) => {
  const expectedValue = Number(opportunity.expected_value || 0);
  const probability = Number(opportunity.probability || 0);
  const ageDays = Math.round((Date.now() - new Date(opportunity.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div 
      onClick={() => onClick(opportunity)}
      className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-navy-300 hover:shadow-md cursor-pointer transition-all flex flex-col gap-2 group relative"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id: opportunity.id, stage: opportunity.stage }));
        e.currentTarget.classList.add('opacity-50');
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('opacity-50');
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-navy-700 transition-colors">
          {opportunity.lead?.customer_name || 'Unknown Prospect'}
        </h3>
        {probability > 0 && (
          <span className="text-[10px] font-black px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md border border-green-100 shrink-0">
            {probability}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">{opportunity.project?.name || 'No Project'}</span>
        </div>
        {opportunity.property?.title && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{opportunity.property.title}</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-slate-700 font-bold text-sm">
          <span>₹{(expectedValue / 100000).toFixed(1)}L</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title="Time in Sales Pipeline">
          <Clock className="w-3 h-3" />
          <span>{ageDays}d</span>
        </div>
      </div>
    </div>
  );
};
