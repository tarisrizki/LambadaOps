import { api } from '@/lib/api';
import type { AssignAssetInput, TransferAssetInput, ReturnAssetInput } from '../schemas';

export async function getAssignments(search?: string) {
  const res = await api.api.assignments.$get({
    query: {
      search: search || undefined,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch assignments');
  const json = await res.json();
  return json.data;
}

export async function getAssignmentById(id: number) {
  const res = await api.api.assignments[':id'].$get({
    param: { id: String(id) },
  });
  if (!res.ok) throw new Error('Failed to fetch assignment');
  const json = await res.json();
  return json.data;
}

export async function assignAsset(assetId: number, payload: AssignAssetInput) {
  const res = await api.api.assets[':assetId'].assignments.$post({
    param: { assetId: String(assetId) },
    json: payload,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null) as Record<string, unknown>;
    throw new Error(error?.message as string || 'Failed to assign asset');
  }
  const json = await res.json();
  return json.data;
}

export async function transferAsset(assetId: number, payload: TransferAssetInput) {
  const res = await api.api.assets[':assetId'].assignments.transfer.$post({
    param: { assetId: String(assetId) },
    json: payload,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null) as Record<string, unknown>;
    throw new Error(error?.message as string || 'Failed to transfer asset');
  }
  const json = await res.json();
  return json.data;
}

export async function returnAsset(assetId: number, payload: ReturnAssetInput) {
  const res = await api.api.assets[':assetId'].assignments.return.$post({
    param: { assetId: String(assetId) },
    json: payload,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null) as Record<string, unknown>;
    throw new Error(error?.message as string || 'Failed to return asset');
  }
  const json = await res.json();
  return json.data;
}
