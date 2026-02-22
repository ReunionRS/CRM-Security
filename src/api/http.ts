import { Capacitor } from '@capacitor/core';

const WEB_API_BASE = import.meta.env.VITE_API_URL || '/api';
const NATIVE_API_BASE = import.meta.env.VITE_API_MOBILE_URL || 'https://martstroyizhevskcrm.ru/api';
const API_BASE = Capacitor.isNativePlatform() ? NATIVE_API_BASE : WEB_API_BASE;

export const TOKEN_KEY = 'crm_token';
export const USER_KEY = 'crm_user';

export interface ApiRequestError extends Error {
  status?: number;
  isNetworkError?: boolean;
}

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

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    const networkError = new Error(error instanceof Error ? error.message : 'Network error') as ApiRequestError;
    networkError.isNetworkError = true;
    throw networkError;
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep default message
    }
    const requestError = new Error(message) as ApiRequestError;
    requestError.status = res.status;
    throw requestError;
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
