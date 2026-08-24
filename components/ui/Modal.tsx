'use client';

import React from 'react';
import { X } from '@/components/ui/Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const maxWidthMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  if (!isOpen) return null;

  const maxWClass = maxWidthMap[maxWidth] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible print:z-auto">
      <div
        className={`bg-white border border-slate-200 rounded-2xl shadow-2xl ${maxWClass} w-full my-8 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:my-0 print:w-full print:rounded-none print:p-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0 print:hidden">
          <h2 className="text-base font-black text-slate-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">{children}</div>
      </div>
    </div>
  );
}
