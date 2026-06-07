import { useAuthStore } from "../store/auth";

const BASE = "/api";

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    // Session expired or account locked mid-session → auto logout
    if ((res.status === 401 || res.status === 423) && token) {
      useAuthStore.getState().logout();
    }
    const error = new Error(err.error || res.statusText) as Error & { status: number; body: any };
    error.status = res.status;
    error.body = err;
    throw error;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => apiRequest<T>("GET", path),
  post: <T>(path: string, body: unknown) => apiRequest<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => apiRequest<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>("PATCH", path, body),
  delete: <T>(path: string) => apiRequest<T>("DELETE", path),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      if ((res.status === 401 || res.status === 423) && token) {
        useAuthStore.getState().logout();
      }
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },
};
