import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { maintenanceKeys } from './query-keys';
import {
  scheduleMaintenance,
  startMaintenance,
  pauseMaintenance,
  resumeMaintenance,
  completeMaintenance,
  cancelMaintenance,
} from './client';

export function useScheduleMaintenance() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: scheduleMaintenance,
    onSuccess: (data) => {
      toast.success('Maintenance job scheduled successfully');
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      router.push(`/maintenance/${data.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to schedule maintenance job');
    },
  });
}

export function useStartMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version, note }: { id: number; version: number; note?: string }) =>
      startMaintenance(id, { version, note }),
    onSuccess: (_, variables) => {
      toast.success('Maintenance job started');
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to start maintenance job');
    },
  });
}

export function usePauseMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version, note }: { id: number; version: number; note?: string }) =>
      pauseMaintenance(id, { version, note }),
    onSuccess: (_, variables) => {
      toast.success('Maintenance job paused');
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to pause maintenance job');
    },
  });
}

export function useResumeMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version, note }: { id: number; version: number; note?: string }) =>
      resumeMaintenance(id, { version, note }),
    onSuccess: (_, variables) => {
      toast.success('Maintenance job resumed');
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to resume maintenance job');
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version, note }: { id: number; version: number; note?: string }) =>
      completeMaintenance(id, { version, note }),
    onSuccess: (_, variables) => {
      toast.success('Maintenance job completed');
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete maintenance job');
    },
  });
}

export function useCancelMaintenance() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, version, note }: { id: number; version: number; note?: string }) =>
      cancelMaintenance(id, { version, note }),
    onSuccess: (_, variables) => {
      toast.success('Maintenance job cancelled');
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
      router.push('/maintenance');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel maintenance job');
    },
  });
}
