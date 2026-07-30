import { queryOptions } from '@tanstack/react-query';
import { maintenanceKeys } from './query-keys';
import { getMaintenanceJobs, getMaintenanceJobById } from './client';

export const maintenanceQueries = {
  list: (assetId?: number) =>
    queryOptions({
      queryKey: maintenanceKeys.list({ assetId }),
      queryFn: () => getMaintenanceJobs(assetId),
      staleTime: 60 * 1000,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: maintenanceKeys.detail(id),
      queryFn: () => getMaintenanceJobById(id),
      staleTime: 60 * 1000,
      enabled: !!id,
    }),
};
