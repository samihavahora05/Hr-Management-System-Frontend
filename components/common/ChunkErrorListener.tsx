'use client';

import { useEffect } from 'react';

/**
 * Handles ChunkLoadError globally across the Next.js application.
 * When a deployment happens or server restarts, old cached HTML pages may
 * try to fetch chunk hashes that no longer exist on the server (returning 404).
 * This listener catches the error and triggers a hard reload to get fresh assets.
 */
export function ChunkErrorListener() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : event.reason;
      const errorMessage = error?.message || error?.toString() || '';
      const isChunkError =
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Failed to load chunk') ||
        errorMessage.includes('Loading chunk');

      if (isChunkError) {
        const lastReload = sessionStorage.getItem('last_chunk_reload');
        const now = Date.now();
        // Prevent infinite reload loops (limit to once per 10 seconds)
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('last_chunk_reload', now.toString());
          console.warn('ChunkLoadError detected. Reloading to fetch latest assets...');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return null;
}
