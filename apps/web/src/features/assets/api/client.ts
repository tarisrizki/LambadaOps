import { api } from '@/lib/api';
import type { CreateAssetInput, UpdateAssetInput } from '../schemas';

// --- ASSETS ---

export async function getAssets(search?: string) {
  const res = await api.api.assets.$get({
    query: {
      search: search || undefined,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch assets');
  const json = await res.json();
  return json.data;
}

export async function getAssetById(id: number) {
  const res = await api.api.assets[':id'].$get({
    param: { id: String(id) },
  });
  if (!res.ok) throw new Error('Failed to fetch asset');
  const json = await res.json();
  return json.data;
}

export async function getAssetByQrCode(qrCodeToken: string) {
  const res = await api.api.assets.scan[':qrCodeToken'].$get({
    param: { qrCodeToken },
  });
  if (!res.ok) throw new Error('Failed to fetch asset from QR code');
  const json = await res.json();
  return json.data;
}

export async function createAsset(payload: CreateAssetInput) {
  const res = await api.api.assets.$post({ json: payload });
  if (!res.ok) {
    const error = await res.json().catch(() => null) as Record<string, unknown>;
    throw new Error(error?.message as string || 'Failed to create asset');
  }
  const json = await res.json();
  return json.data;
}

export async function updateAsset(id: number, payload: UpdateAssetInput) {
  const res = await api.api.assets[':id'].$put({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null) as Record<string, unknown>;
    throw new Error(error?.message as string || 'Failed to update asset');
  }
  const json = await res.json();
  return json.data;
}

export async function deleteAsset(id: number, version: number) {
  const res = await api.api.assets[':id'].$delete({
    param: { id: String(id) },
    json: { version },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null) as Record<string, unknown>;
    throw new Error(error?.message as string || 'Failed to delete asset');
  }
  const json = await res.json();
  return json.data;
}

// --- REFERENCE DATA ---

export async function getCategories() {
  const res = await api.api.reference.categories.$get();
  if (!res.ok) throw new Error('Failed to fetch categories');
  const json = await res.json();
  return json.data;
}

export async function getLocations() {
  const res = await api.api.reference.locations.$get();
  if (!res.ok) throw new Error('Failed to fetch locations');
  const json = await res.json();
  return json.data;
}

export async function getDepartments() {
  const res = await api.api.reference.departments.$get();
  if (!res.ok) throw new Error('Failed to fetch departments');
  const json = await res.json();
  return json.data;
}

export async function getUsers() {
  const res = await api.api.reference.users.$get();
  if (!res.ok) throw new Error('Failed to fetch users');
  const json = await res.json();
  return json.data;
}

// --- CATEGORIES CRUD ---

export async function createCategory(name: string) {
  const res = await api.api.reference.categories.$post({ json: { name } });
  if (!res.ok) throw new Error('Failed to create category');
  const json = await res.json();
  return json.data;
}

export async function updateCategory(id: number, name: string) {
  const res = await api.api.reference.categories[':id'].$put({ param: { id: String(id) }, json: { name } });
  if (!res.ok) throw new Error('Failed to update category');
  const json = await res.json();
  return json.data;
}

export async function deleteCategory(id: number) {
  const res = await api.api.reference.categories[':id'].$delete({ param: { id: String(id) } });
  if (!res.ok) throw new Error('Failed to delete category');
  const json = await res.json();
  return json.data;
}

// --- LOCATIONS CRUD ---

export async function createLocation(name: string) {
  const res = await api.api.reference.locations.$post({ json: { name } });
  if (!res.ok) throw new Error('Failed to create location');
  const json = await res.json();
  return json.data;
}

export async function updateLocation(id: number, name: string) {
  const res = await api.api.reference.locations[':id'].$put({ param: { id: String(id) }, json: { name } });
  if (!res.ok) throw new Error('Failed to update location');
  const json = await res.json();
  return json.data;
}

export async function deleteLocation(id: number) {
  const res = await api.api.reference.locations[':id'].$delete({ param: { id: String(id) } });
  if (!res.ok) throw new Error('Failed to delete location');
  const json = await res.json();
  return json.data;
}

// --- DEPARTMENTS CRUD ---

export async function createDepartment(name: string) {
  const res = await api.api.reference.departments.$post({ json: { name } });
  if (!res.ok) throw new Error('Failed to create department');
  const json = await res.json();
  return json.data;
}

export async function updateDepartment(id: number, name: string) {
  const res = await api.api.reference.departments[':id'].$put({ param: { id: String(id) }, json: { name } });
  if (!res.ok) throw new Error('Failed to update department');
  const json = await res.json();
  return json.data;
}

export async function deleteDepartment(id: number) {
  const res = await api.api.reference.departments[':id'].$delete({ param: { id: String(id) } });
  if (!res.ok) throw new Error('Failed to delete department');
  const json = await res.json();
  return json.data;
}
