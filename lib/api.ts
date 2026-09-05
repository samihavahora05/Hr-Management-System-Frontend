function normalizeApiBase(base: string): string {
  let cleaned = (base || '').trim().replace(/\/+$/, '');
  if (!cleaned) return 'http://127.0.0.1:8000/api';
  if (!cleaned.endsWith('/api')) {
    cleaned += '/api';
  }
  return cleaned;
}

export function getPrimaryApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  }

  // If in browser on a production domain (not localhost or 127.0.0.1)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}/api`;
  }

  return 'http://127.0.0.1:8000/api';
}

function buildApiUrl(base: string, endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (cleanEndpoint.startsWith('/api/')) {
    const rootBase = base.replace(/\/api$/, '');
    return `${rootBase}${cleanEndpoint}`;
  }
  return `${base}${cleanEndpoint}`;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
    headers['X-Bearer-Token'] = token;
  }

  const primaryBase = getPrimaryApiBase();
  const primaryUrl = buildApiUrl(primaryBase, endpoint);

  let res: Response;
  try {
    res = await fetch(primaryUrl, {
      ...options,
      headers,
    });
  } catch (err) {
    // Fallback: try relative or alternate if primary threw a network error
    const fallbackBase = typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/api`
      : 'http://127.0.0.1:8000/api';

    if (fallbackBase !== primaryBase) {
      const fallbackUrl = buildApiUrl(fallbackBase, endpoint);
      res = await fetch(fallbackUrl, {
        ...options,
        headers,
      });
    } else {
      throw err;
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      const isCriticalAuthRoute = endpoint.includes('/auth/me') || endpoint.includes('/auth/change-password');
      // Only force redirect if critical auth state validation fails and user is not already on login
      if (isCriticalAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    throw new Error(data.message || 'An error occurred while fetching data');
  }

  return data;
}

export async function downloadApiFile(endpoint: string, fallbackFilename = 'document.pdf') {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const primaryBase = getPrimaryApiBase();
  const primaryUrl = buildApiUrl(primaryBase, endpoint);

  let res: Response;
  try {
    res = await fetch(primaryUrl, { headers });
  } catch (err) {
    const fallbackBase = typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/api`
      : 'http://127.0.0.1:8000/api';

    if (fallbackBase !== primaryBase) {
      const fallbackUrl = buildApiUrl(fallbackBase, endpoint);
      res = await fetch(fallbackUrl, { headers });
    } else {
      throw err;
    }
  }

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Failed to download file (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fallbackFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
