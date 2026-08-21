const PRIMARY_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const FALLBACK_API_BASE = 'http://localhost:8000/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${PRIMARY_API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    // If primary (127.0.0.1) fails, try fallback (localhost)
    res = await fetch(`${FALLBACK_API_BASE}${endpoint}`, {
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
