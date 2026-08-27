'use client';

import React from 'react';
import { CheckCircle2, X } from '@/components/ui/Icon';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  if (!message) return null;

  const bgStyles =
    type === 'success'
      ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
      : type === 'error'
      ? 'bg-rose-900 text-rose-50 border-rose-700'
      : 'bg-slate-900 text-slate-50 border-slate-700';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold max-w-md ${bgStyles}`}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
