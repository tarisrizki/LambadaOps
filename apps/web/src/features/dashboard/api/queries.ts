import { queryOptions } from '@tanstack/react-query';
import { dashboardKeys } from './query-keys';
import { fetchSummary, fetchActivity } from './client';

export const dashboardQueries = {
  summary: () =>
    queryOptions({
      queryKey: dashboardKeys.summary(),
      queryFn: fetchSummary,
      staleTime: 30 * 1000, // 30 seconds
    }),
  activity: () =>
    queryOptions({
      queryKey: dashboardKeys.activity(),
      queryFn: fetchActivity,
      staleTime: 30 * 1000,
    }),
};
