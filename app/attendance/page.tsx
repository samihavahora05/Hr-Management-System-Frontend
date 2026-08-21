'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AttendancePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        const role = strtolower(user.role);
        if (role === 'admin') {
          router.replace('/admin/attendance');
        } else if (role === 'hr') {
          router.replace('/hr/attendance');
        } else if (role === 'manager' || role === 'team_leader' || role === 'tl' || role === 'team_lead') {
          router.replace('/manager/attendance');
        } else {
          router.replace('/employee/attendance');
        }
      }
    }
  }, [user, loading, router]);

  function strtolower(str: string) {
    return (str || '').toLowerCase();
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span>Navigating to attendance portal...</span>
      </div>
    </div>
  );
}
