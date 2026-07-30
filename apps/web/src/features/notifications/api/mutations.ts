import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAsRead } from './client';
import { notificationKeys } from './query-keys';

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    },
  });
}
