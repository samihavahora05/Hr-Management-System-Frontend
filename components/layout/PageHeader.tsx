'use client';

import React from 'react';
import { IconProps } from '@/components/ui/Icon';

interface ActionObject {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<IconProps>;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode | ActionObject;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const isReactNode = React.isValidElement(action);
  const actionObj = !isReactNode && action ? (action as ActionObject) : null;
  const Icon = actionObj?.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-slate-200/90 gap-3 sm:gap-4 min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">{title}</h1>
        {description && <p className="text-xs text-slate-500 font-medium mt-0.5 sm:mt-1">{description}</p>}
      </div>

      {isReactNode ? (
        <div className="shrink-0 flex items-center flex-wrap gap-2">{action}</div>
      ) : actionObj ? (
        <button
          onClick={actionObj.onClick}
          className="inline-flex items-center justify-center gap-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all duration-200 cursor-pointer shrink-0"
        >
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span>{actionObj.label}</span>
        </button>
      ) : null}
    </div>
  );
}
