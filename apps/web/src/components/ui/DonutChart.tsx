import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  totalLabel?: string;
  height?: number;
}

export function DonutChart({ data, totalLabel = 'Total', height = 250 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm h-full flex flex-col relative">
      <div className="flex-1 min-h-0 relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="65%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#172A52', fontWeight: 500 }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Total Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-navy-900">{total}</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{totalLabel}</span>
        </div>
      </div>
      
      {/* Legend below the chart */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center text-sm">
            <span 
              className="w-3 h-3 rounded-full mr-2 shrink-0" 
              style={{ backgroundColor: item.color }} 
            />
            <span className="text-slate-600 truncate mr-auto">{item.name}</span>
            <span className="font-semibold text-navy-900 ml-2">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
