'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ManagerPerformancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/manager/dashboard');
  }, [router]);

  return null;
}
