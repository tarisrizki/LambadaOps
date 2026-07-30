import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignAsset, transferAsset, returnAsset } from './client';
import { assignmentKeys } from './query-keys';
import { assetKeys } from '@/features/assets/api/query-keys';

import type { AssignAssetInput, TransferAssetInput, ReturnAssetInput } from '../schemas';

export function useAssignAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: number; payload: AssignAssetInput }) => assignAsset(assetId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function useTransferAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: number; payload: TransferAssetInput }) => transferAsset(assetId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function useReturnAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: number; payload: ReturnAssetInput }) => returnAsset(assetId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}
