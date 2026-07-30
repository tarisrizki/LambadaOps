import { api } from '@/lib/api';

export async function getRecentExports() {
  const res = await api.api.export.recent.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch recent exports');
  }
  const json = await res.json();
  return json.data;
}

export async function getExportJob(id: number) {
  const res = await api.api.export[':id'].$get({
    param: { id: String(id) },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch export status');
  }
  const json = await res.json();
  return json.data;
}

export async function triggerExport(entityType: 'assets' | 'tickets') {
  const res = await api.api.export.$post({
    json: { entityType },
  });
  if (!res.ok) {
    throw new Error('Failed to start export');
  }
  const json = await res.json();
  return json.data;
}
