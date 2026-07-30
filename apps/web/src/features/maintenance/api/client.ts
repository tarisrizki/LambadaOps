import { api } from '@/lib/api';
import type { ScheduleMaintenanceInput, MaintenanceActionInput } from '../schemas';

export async function getMaintenanceJobs(assetId?: number) {
  const res = await api.api.maintenance.$get({
    query: assetId ? { assetId: String(assetId) } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch maintenance jobs');
  const json = await res.json();
  return json.data;
}

export async function getMaintenanceJobById(id: number) {
  const res = await api.api.maintenance[':id'].$get({
    param: { id: String(id) },
  });
  if (!res.ok) throw new Error('Failed to fetch maintenance job details');
  const json = await res.json();
  return json.data;
}

export async function scheduleMaintenance(payload: ScheduleMaintenanceInput) {
  const res = await api.api.maintenance.$post({ json: payload });
  if (!res.ok) {
    const error = await res.json();
    throw new Error('message' in error ? (error.message as string) : 'Failed to schedule maintenance');
  }
  const json = await res.json();
  return json.data;
}

export async function startMaintenance(id: number, payload: MaintenanceActionInput) {
  const res = await api.api.maintenance[':id'].start.$post({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) throw new Error('Failed to start maintenance');
  const json = await res.json();
  return json.data;
}

export async function pauseMaintenance(id: number, payload: MaintenanceActionInput) {
  const res = await api.api.maintenance[':id'].pause.$post({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) throw new Error('Failed to pause maintenance');
  const json = await res.json();
  return json.data;
}

export async function resumeMaintenance(id: number, payload: MaintenanceActionInput) {
  const res = await api.api.maintenance[':id'].resume.$post({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) throw new Error('Failed to resume maintenance');
  const json = await res.json();
  return json.data;
}

export async function completeMaintenance(id: number, payload: MaintenanceActionInput) {
  const res = await api.api.maintenance[':id'].complete.$post({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) throw new Error('Failed to complete maintenance');
  const json = await res.json();
  return json.data;
}

export async function cancelMaintenance(id: number, payload: MaintenanceActionInput) {
  const res = await api.api.maintenance[':id'].cancel.$post({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) throw new Error('Failed to cancel maintenance');
  const json = await res.json();
  return json.data;
}
