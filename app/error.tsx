'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from '@/components/ui/Icon';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Runtime Boundary Caught Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">Something went wrong</h2>
          <p className="text-xs text-slate-500 mt-1">
            {error.message || 'An unexpected error occurred while rendering this page.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => window.location.href = '/admin/dashboard'}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
