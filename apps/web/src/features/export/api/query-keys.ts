export const exportKeys = {
  all: ['exports'] as const,
  recent: () => [...exportKeys.all, 'recent'] as const,
  detail: (id: number) => [...exportKeys.all, 'detail', id] as const,
};
