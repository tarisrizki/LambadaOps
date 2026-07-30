import { hc } from 'hono/client';
import type { AppType } from '@lambadaops/api/src/index.js';

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const api = hc<AppType>(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
  headers: () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
  }
});
