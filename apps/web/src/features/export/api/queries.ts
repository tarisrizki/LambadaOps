import { queryOptions } from '@tanstack/react-query';
import { exportKeys } from './query-keys';
import { getRecentExports, getExportJob } from './client';

export const exportQueries = {
  recent: () =>
    queryOptions({
      queryKey: exportKeys.recent(),
      queryFn: () => getRecentExports(),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: exportKeys.detail(id),
      queryFn: () => getExportJob(id),
      // Poll every 3 seconds if status might be pending/processing
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data && (data.status === 'pending' || data.status === 'processing')) {
          return 3000;
        }
        return false;
      }
    }),
};
