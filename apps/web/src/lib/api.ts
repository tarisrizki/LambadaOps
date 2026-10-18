import { hc } from 'hono/client';
import type { AppType } from '@lambadaops/api/src/index.js';
import { getTokenCookie, getCsrfToken } from '@/lib/cookies';

/**
 * Read the auth token — checks the cookie first, then falls back to
 * localStorage for backward compatibility.  (See ENG-005.)
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // Prefer cookie (new path)
    const cookieToken = getTokenCookie();
    if (cookieToken) return cookieToken;
    // Fallback to localStorage (legacy / transitional)
    return localStorage.getItem('token');
  }
  return null;
};

export const api = hc<AppType>(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
  headers: () => {
    const token = getAuthToken();
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    return headers;
  },
});
