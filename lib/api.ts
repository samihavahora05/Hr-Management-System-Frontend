function normalizeApiBase(base: string) {
  let cleaned = (base || '').trim().replace(/\/+$/, '');
  if (!cleaned) return 'http://127.0.0.1:8000/api';
  if (!cleaned.endsWith('/api')) {
    cleaned += '/api';
  }
  return cleaned;
}

function buildApiUrl(base: string, endpoint: string) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (cleanEndpoint.startsWith('/api/')) {
    const rootBase = base.replace(/\/api$/, '');
    return `${rootBase}${cleanEndpoint}`;
  }
  return `${base}${cleanEndpoint}`;
}

const PRIMARY_API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api');
const FALLBACK_API_BASE = 'http://localhost:8000/api';

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
  }

  const primaryUrl = buildApiUrl(PRIMARY_API_BASE, endpoint);
  const fallbackUrl = buildApiUrl(FALLBACK_API_BASE, endpoint);

  let res: Response;
  try {
    res = await fetch(primaryUrl, {
      ...options,
      headers,
    });
  } catch (err) {
    // If primary fails, try fallback
    res = await fetch(fallbackUrl, {
      ...options,
      headers,
    });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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

  const primaryUrl = buildApiUrl(PRIMARY_API_BASE, endpoint);
  const fallbackUrl = buildApiUrl(FALLBACK_API_BASE, endpoint);

  let res: Response;
  try {
    res = await fetch(primaryUrl, { headers });
  } catch (err) {
    res = await fetch(fallbackUrl, { headers });
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
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
