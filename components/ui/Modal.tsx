'use client';

import React, { useEffect } from 'react';
import { X } from '@/components/ui/Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  noPadding?: boolean;
  contentClassName?: string;
  zIndex?: string;
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

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  noPadding = false,
  contentClassName = '',
  zIndex = 'z-50',
}: ModalProps) {
  // Prevent body scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWClass = maxWidthMap[maxWidth] || 'max-w-lg';

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible print:z-auto`}
      onClick={onClose}
    >
      <div
        className={`bg-white border border-slate-200/90 rounded-2xl shadow-2xl ${maxWClass} w-full my-auto overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:my-0 print:w-full print:rounded-none print:p-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 bg-slate-50/90 shrink-0 print:hidden gap-3">
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">{title}</h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div
          className={`overflow-y-auto flex-1 print:p-0 print:overflow-visible min-w-0 ${
            noPadding ? 'p-0' : 'p-3.5 sm:p-6'
          } ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

