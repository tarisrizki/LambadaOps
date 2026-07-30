export const notificationKeys = {
  all: ['notification'] as const,
  list: (filters?: Record<string, unknown>) => [...notificationKeys.all, 'list', filters] as const,
  detail: (id: string | number) => [...notificationKeys.all, 'detail', String(id)] as const,
};
