export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...assetKeys.details(), String(id)] as const,
  scans: () => [...assetKeys.all, 'scan'] as const,
  scan: (token: string) => [...assetKeys.scans(), token] as const,

  meta: () => ['reference'] as const,
  categories: () => [...assetKeys.meta(), 'categories'] as const,
  locations: () => [...assetKeys.meta(), 'locations'] as const,
  departments: () => [...assetKeys.meta(), 'departments'] as const,
  users: () => [...assetKeys.meta(), 'users'] as const,
};
