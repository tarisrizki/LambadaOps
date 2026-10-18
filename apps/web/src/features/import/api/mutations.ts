import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadAssets, commitImportJob } from './client';
import { importKeys } from './query-keys';

export function useUploadAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAssets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
      toast.success('File uploaded and validated. Ready for commit.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });
}

export function useCommitImportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: commitImportJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
      toast.success('Import committed successfully.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to commit import');
    },
  });
}
