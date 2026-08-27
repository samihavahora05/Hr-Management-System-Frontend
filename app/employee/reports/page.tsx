'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employee/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-indigo-400">
        <span className="w-4 h-4 rounded-full bg-indigo-500 animate-ping"></span>
        <span className="text-sm font-medium">Redirecting to Employee Dashboard...</span>
      </div>
    </div>
  );
}
