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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all duration-150 group">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-700 group-hover:border-sky-200 transition-colors duration-150">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{value}</p>
      {(subtext || trend) && (
        <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
          {subtext && <span className="text-slate-500 text-[11px] font-medium">{subtext}</span>}
          {trend && (
            <span className={`font-bold text-[11px] ${trend.positive ? 'text-emerald-700' : 'text-amber-700'}`}>
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
