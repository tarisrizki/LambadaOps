import { queryOptions } from '@tanstack/react-query';
import { notificationKeys } from './query-keys';
import { getUnreadNotifications } from './client';

export const notificationQueries = {
  unread: () =>
    queryOptions({
      queryKey: notificationKeys.unread(),
      queryFn: () => getUnreadNotifications(),
      refetchInterval: 30000, // Poll every 30s for new notifications
    }),
};
