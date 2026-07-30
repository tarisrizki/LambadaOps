import { queryOptions } from '@tanstack/react-query';
import { getAssignments, getAssignmentById } from './client';
import { assignmentKeys } from './query-keys';

export const assignmentQueries = {
  list: (search?: string) =>
    queryOptions({
      queryKey: assignmentKeys.list({ search }),
      queryFn: () => getAssignments(search),
    }),
  
  detail: (id: number) =>
    queryOptions({
      queryKey: assignmentKeys.detail(id),
      queryFn: () => getAssignmentById(id),
      enabled: !!id,
    }),
};
