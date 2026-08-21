'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HRPerformancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hr/dashboard');
  }, [router]);

  return null;
}
