import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ListItem {
  id: string | number;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
}

interface ListWidgetProps {
  title: string;
  items: ListItem[];
  viewAllLink?: string;
  emptyStateMessage?: string;
}

export function ListWidget({ title, items, viewAllLink, emptyStateMessage = 'No items found' }: ListWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-navy-900">{title}</h3>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-sm font-medium text-action hover:text-navy-700 transition-colors">
            View All
          </Link>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            {emptyStateMessage}
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors group cursor-pointer">
                <div className="flex items-center min-w-0">
                  {item.icon && (
                    <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center shrink-0 mr-4 group-hover:bg-white transition-colors">
                      <item.icon className="w-5 h-5 text-navy-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900 truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-sm text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                </div>
                {item.meta && (
                  <div className="ml-4 shrink-0 text-right">
                    {item.meta}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
