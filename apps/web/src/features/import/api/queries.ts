import { queryOptions } from '@tanstack/react-query';
import { importKeys } from './query-keys';
import { getImportJobs, getImportJob, getImportErrors } from './client';

export const importQueries = {
  list: () =>
    queryOptions({
      queryKey: importKeys.list(),
      queryFn: () => getImportJobs(),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: importKeys.detail(id),
      queryFn: () => getImportJob(id),
    }),
  errors: (id: number) =>
    queryOptions({
      queryKey: importKeys.errors(id),
      queryFn: () => getImportErrors(id),
    }),
};
