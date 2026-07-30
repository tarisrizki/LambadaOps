import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetKeys } from './query-keys';
import { createAsset, updateAsset, deleteAsset } from './client';
import { toast } from 'sonner';

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('Asset created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create asset');
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateAsset>[1] }) =>
      updateAsset(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      toast.success('Asset updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update asset');
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version }: { id: number; version: number }) => deleteAsset(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('Asset deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete asset');
    },
  });
}
