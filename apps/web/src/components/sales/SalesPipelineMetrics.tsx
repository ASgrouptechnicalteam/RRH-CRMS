import React from 'react';
import { Target, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { PipelineMetricsData } from '../../types';

interface MetricsProps {
  metrics: PipelineMetricsData;
  isLoading: boolean;
}

export const SalesPipelineMetrics: React.FC<MetricsProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm min-h-[100px] flex items-center justify-center animate-pulse">
        <div className="flex gap-12">
          <div className="w-32 h-12 bg-slate-100 rounded-lg"></div>
          <div className="w-32 h-12 bg-slate-100 rounded-lg"></div>
          <div className="w-32 h-12 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Active Pipeline Deals */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="bg-indigo-100 p-3 rounded-xl">
          <Activity className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Deals</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{metrics.activeCount || 0}</span>
            <span className="text-xs text-slate-400 font-medium">/ {metrics.totalCount || 0} Total</span>
          </div>
        </div>
      </div>

      {/* Expected Sale Value */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="bg-emerald-100 p-3 rounded-xl">
          <Target className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected Pipeline Value</p>
          <span className="text-xl font-black text-slate-800">
            ₹{((metrics.totalExpectedValue || 0) / 100000).toFixed(2)} L
          </span>
        </div>
      </div>

      {/* Weighted Sale Value */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="bg-blue-100 p-3 rounded-xl">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weighted Pipeline Value</p>
          <span className="text-xl font-black text-blue-700">
            ₹{((metrics.totalWeightedValue || 0) / 100000).toFixed(2)} L
          </span>
        </div>
      </div>

      {/* Conversion Terminal Stats */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-600">Booking Initiated</span>
          <span className="font-bold text-teal-600">{metrics.bookingInitiatedCount || 0}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1 border-t border-slate-100 pt-1">
          <span className="font-semibold text-slate-600">Dropped Deals</span>
          <span className="font-bold text-rose-600">{metrics.droppedCount || 0}</span>
        </div>
      </div>
    </div>
  );
};
