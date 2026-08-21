'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        const role = (user.role || '').toLowerCase();
        if (role === 'admin') {
          router.replace('/admin/reports');
        } else if (role === 'hr') {
          router.replace('/hr/reports');
        } else if (role === 'manager') {
          router.replace('/manager/reports');
        } else {
          router.replace('/employee/dashboard');
        }
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span>Navigating to reports portal...</span>
      </div>
    </div>
  );
}
