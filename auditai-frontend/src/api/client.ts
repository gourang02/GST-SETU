export const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8000';
export const WS_BASE = (import.meta as any).env?.VITE_WS_BASE ?? 'ws://localhost:8000';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken() {
  return localStorage.getItem('auth_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new Event('auth:logout'));
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(err.detail || err.message || 'Request failed', res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File) => {
    const token = getToken();
    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: (() => {
        const formData = new FormData();
        formData.append('file', file);
        return formData;
      })(),
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new ApiError(err.detail || 'Request failed', res.status);
      }
      return res.json() as Promise<T>;
    });
  },
};
