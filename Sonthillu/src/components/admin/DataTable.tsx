'use client';

import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  emptyMessage?: string;
  caption?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  keyField,
  emptyMessage = 'No data available.',
  caption,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
      {caption && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-text-primary">{caption}</p>
        </div>
      )}
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted border-b border-border">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 font-medium text-text-primary ${col.className ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={String(row[keyField])} className="hover:bg-neutral-50/50 transition-colors">
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-4 py-3 ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String(row[col.key as string] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
