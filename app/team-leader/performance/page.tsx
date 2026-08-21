'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamLeaderPerformancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/team-leader/dashboard');
  }, [router]);

  return null;
}
