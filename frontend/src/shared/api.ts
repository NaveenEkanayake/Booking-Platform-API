const API_BASE = '';

let authToken: string | null = localStorage.getItem('token');
let refreshToken: string | null = localStorage.getItem('refreshToken');

export function setTokens(access: string, refresh: string) {
  authToken = access;
  refreshToken = refresh;
  localStorage.setItem('token', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  authToken = null;
  refreshToken = null;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}

export function getToken() {
  return authToken;
}

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Request failed');
  }

  // TransformInterceptor wraps responses in { statusCode, data, timestamp }
  // Paginated responses also have meta at top level — preserve both
  const jsonBody = json as any;
  if (jsonBody.data !== undefined && jsonBody.meta !== undefined) {
    return { data: jsonBody.data, meta: jsonBody.meta } as any;
  }
  return jsonBody.data ?? json;
}

// ── Shared Types ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
