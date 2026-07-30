export const billingKeys = {
  all: ['billing'] as const,
  list: (filters?: Record<string, unknown>) => [...billingKeys.all, 'list', filters] as const,
  detail: (id: string | number) => [...billingKeys.all, 'detail', String(id)] as const,
};
