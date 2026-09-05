'use client';

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, X } from '@/components/ui/Icon';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'success' | 'danger' | 'warning' | 'primary';
  details?: React.ReactNode;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  details,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    success: {
      iconBg: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
    },
    danger: {
      iconBg: 'bg-rose-100 text-rose-700 border border-rose-200',
      icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-700 border border-amber-200',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
    },
    primary: {
      iconBg: 'bg-[#081e3a]/10 text-[#081e3a] border border-[#081e3a]/20',
      icon: <CheckCircle className="w-6 h-6 text-[#081e3a]" />,
      btn: 'bg-[#081e3a] hover:bg-[#10305a] text-white shadow-xs',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
              {variantStyles.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {description}
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {details && (
            <div className="mt-4 p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs overflow-x-auto">
              {details}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors text-center"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 ${variantStyles.btn}`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
