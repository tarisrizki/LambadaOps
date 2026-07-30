import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadAssets } from './client';
import { importKeys } from './query-keys';

export function useUploadAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAssets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
      toast.success('File uploaded successfully. Import started.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });
}
