import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { triggerExport } from './client';
import { exportKeys } from './query-keys';

export function useTriggerExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exportKeys.recent() });
      toast.success('Export started successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start export');
    },
  });
}
