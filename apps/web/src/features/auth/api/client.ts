import { api } from '@/lib/api';

export async function fetchMe(token: string | null) {
  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (!activeToken) throw new Error('No token');
  
  const res = await api.api.auth.me.$get(undefined, {
    headers: { Authorization: `Bearer ${activeToken}` },
  });
  
  if (!res.ok) throw new Error('Invalid token');
  return await res.json();
}

export async function login(payload: Record<string, unknown>) {
  // @ts-expect-error - dynamic payload mapping for Hono
  const res = await api.api.auth.login.$post({ json: payload });
  if (!res.ok) {
    const error = await res.json().catch(() => null) as Record<string, unknown>;
    throw new Error((error?.message as string) || 'Invalid credentials');
  }
  return await res.json();
}

export async function register(payload: Record<string, unknown>) {
  // @ts-expect-error - dynamic payload mapping for Hono
  const res = await api.api.auth.register.$post({ json: payload });
  if (!res.ok) {
    const error = await res.json().catch(() => null) as Record<string, unknown>;
    throw new Error((error?.message as string) || 'Registration failed');
  }
  return await res.json();
}
