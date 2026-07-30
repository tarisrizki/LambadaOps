export const importKeys = {
  all: ['imports'] as const,
  lists: () => [...importKeys.all, 'list'] as const,
  list: () => [...importKeys.lists()] as const,
  details: () => [...importKeys.all, 'detail'] as const,
  detail: (id: number) => [...importKeys.details(), id] as const,
  errors: (id: number) => [...importKeys.detail(id), 'errors'] as const,
};
