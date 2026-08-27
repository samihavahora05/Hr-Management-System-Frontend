'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function InsightsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        const role = (user.role || '').toLowerCase();
        if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (role === 'hr') {
          router.replace('/hr/dashboard');
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
        <span>Navigating to insights dashboard...</span>
      </div>
    </div>
  );
}
