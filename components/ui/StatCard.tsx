'use client';

import React from 'react';
import { IconProps } from '@/components/ui/Icon';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ComponentType<IconProps>;
  trend?: {
    text: string;
    positive?: boolean;
  };
}

export function StatCard({ title, value, subtext, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all duration-150 group min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{title}</p>
        {Icon && (
          <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-700 group-hover:border-sky-200 transition-colors duration-150 shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 sm:mt-2 tracking-tight truncate">{value}</p>
      {(subtext || trend) && (
        <div className="flex items-center justify-between gap-1 text-xs mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 flex-wrap">
          {subtext && <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium truncate">{subtext}</span>}
          {trend && (
            <span className={`font-bold text-[10px] sm:text-[11px] shrink-0 ${trend.positive ? 'text-emerald-700' : 'text-amber-700'}`}>
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
