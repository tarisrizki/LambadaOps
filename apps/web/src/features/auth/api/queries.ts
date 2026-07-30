import { queryOptions } from '@tanstack/react-query';
import { authKeys } from './query-keys';
import { fetchMe } from './client';

export const authQueries = {
  me: (token?: string) =>
    queryOptions({
      queryKey: authKeys.me(),
      queryFn: () => fetchMe(token || null),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false, // Don't retry if token is invalid, fail fast
    }),
};
