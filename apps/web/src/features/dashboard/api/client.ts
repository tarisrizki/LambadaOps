import { api } from '@/lib/api';

export async function fetchSummary() {
  const res = await api.api.dashboard.summary.$get();
  
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard summary');
  }

  const { data } = await res.json();
  return data;
}

export async function fetchActivity() {
  // Activity is now included in summary, but keeping this for separate API if needed
  return [];
}
