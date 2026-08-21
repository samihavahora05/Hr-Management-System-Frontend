import React from 'react';
import { IconProps } from '@/components/ui/Icon';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<IconProps>;
  };
  icon?: React.ComponentType<IconProps>;
}

export function EmptyState({ title, description, action, icon: Icon }: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl my-2">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all duration-150 cursor-pointer"
        >
          {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
