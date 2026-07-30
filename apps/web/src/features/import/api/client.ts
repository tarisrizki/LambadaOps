import { api } from '@/lib/api';

export async function getImportJobs() {
  const res = await api.api.import.jobs.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch import history');
  }
  const json = await res.json();
  return json.data;
}

export async function getImportJob(id: number) {
  const res = await api.api.import.jobs[':id'].$get({
    param: { id: String(id) },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch import job');
  }
  const json = await res.json();
  return json.data;
}

export async function getImportErrors(id: number) {
  const res = await api.api.import.jobs[':id'].errors.$get({
    param: { id: String(id) },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch import errors');
  }
  const json = await res.json();
  return json.data;
}

export async function uploadAssets(file: File) {
  const res = await api.api.import.assets.$post({
    form: {
      file,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(err?.message || 'Failed to upload file');
  }
  const json = await res.json();
  return json.data;
}
