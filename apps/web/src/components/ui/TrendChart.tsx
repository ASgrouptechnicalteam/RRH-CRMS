import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface TrendChartData {
  date: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: TrendChartData[];
  color?: string;
  height?: number;
}

export function TrendChart({ title, data, color = '#C9A227', height = 300 }: TrendChartProps) {
  const [period, setPeriod] = useState('month');

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-navy-900">{title}</h3>
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-sm border-slate-200 rounded-lg text-slate-600 bg-surface px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-navy-200"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      <div className="flex-1 min-h-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#172A52', fontWeight: 600 }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: color }}
              activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
