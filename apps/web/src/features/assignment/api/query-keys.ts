export const assignmentKeys = {
  all: ['assignment'] as const,
  list: (filters?: Record<string, unknown>) => [...assignmentKeys.all, 'list', filters] as const,
  detail: (id: string | number) => [...assignmentKeys.all, 'detail', String(id)] as const,
};
