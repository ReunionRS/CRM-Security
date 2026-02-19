const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const TOKEN_KEY = 'crm_token';
export const USER_KEY = 'crm_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getBackendBase(): string {
  return API_BASE.replace(/\/api\/?$/, '');
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  withAuth = true
): Promise<T> {
  const headers = new Headers(init.headers || {});
  const token = getToken();

  if (withAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const bodyIsFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!bodyIsFormData && !headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }

  return (await res.blob()) as T;
}

export function downloadUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function backendAssetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getBackendBase()}${path.startsWith('/') ? path : `/${path}`}`;
}
