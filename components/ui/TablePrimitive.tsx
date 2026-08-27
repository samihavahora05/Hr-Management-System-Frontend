import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

interface Column {
  key: string;
  header: string;
  className?: string;
  render?: (item: any) => React.ReactNode;
}

interface TablePrimitiveProps {
  columns?: Column[];
  data?: any[];
  headers?: string[];
  rows?: React.ReactNode[][];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  keyExtractor?: (item: any, index?: number) => string | number;
}

export function TablePrimitive({
  columns,
  data,
  headers,
  rows,
  loading = false,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no items matching the criteria.',
  emptyAction,
  keyExtractor = (item: any, index?: number) => item?.id ?? index ?? Math.random(),
}: TablePrimitiveProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 space-y-3">
          <div className="h-5 bg-slate-100 rounded-md animate-pulse w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-10 bg-slate-50 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle headers + rows pattern
  if (headers && rows) {
    if (rows.length === 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
        </div>
      );
    }

    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className="px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors duration-150">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-5 py-3.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Handle columns + data pattern
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              {(columns || []).map((col) => (
                <th key={col.key} className={`px-5 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-slate-50/80 transition-colors duration-150"
              >
                {(columns || []).map((col) => (
                  <td key={col.key} className={`px-5 py-3.5 ${col.className || ''}`}>
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
