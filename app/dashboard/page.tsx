'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleDefaultRoute } from '@/lib/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(getRoleDefaultRoute(user.role));
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span>Navigating to role portal...</span>
      </div>
    </div>
  );
}
