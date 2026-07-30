import { queryOptions } from '@tanstack/react-query';
import { assetKeys } from './query-keys';
import { getAssets, getAssetById, getAssetByQrCode, getCategories, getLocations, getDepartments, getUsers } from './client';

export const assetQueries = {
  list: (search?: string) =>
    queryOptions({
      queryKey: assetKeys.list({ search }),
      queryFn: () => getAssets(search),
      staleTime: 5 * 60 * 1000,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: assetKeys.detail(id),
      queryFn: () => getAssetById(id),
      staleTime: 5 * 60 * 1000,
      enabled: !!id,
    }),
  scan: (token: string) =>
    queryOptions({
      queryKey: assetKeys.scan(token),
      queryFn: () => getAssetByQrCode(token),
      staleTime: 5 * 60 * 1000,
      enabled: !!token,
    }),
  categories: () =>
    queryOptions({
      queryKey: assetKeys.categories(),
      queryFn: getCategories,
      staleTime: 60 * 60 * 1000, // 1 hour for reference data
    }),
  locations: () =>
    queryOptions({
      queryKey: assetKeys.locations(),
      queryFn: getLocations,
      staleTime: 60 * 60 * 1000,
    }),
  departments: () =>
    queryOptions({
      queryKey: assetKeys.departments(),
      queryFn: getDepartments,
      staleTime: 60 * 60 * 1000,
    }),
  users: () =>
    queryOptions({
      queryKey: assetKeys.users(),
      queryFn: getUsers,
      staleTime: 60 * 60 * 1000,
    }),
};
