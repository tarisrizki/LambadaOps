import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetKeys } from './query-keys';
import { 
  createAsset, updateAsset, deleteAsset,
  createCategory, updateCategory, deleteCategory,
  createLocation, updateLocation, deleteLocation,
  createDepartment, updateDepartment, deleteDepartment
} from './client';
import { toast } from 'sonner';

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('Asset created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create asset');
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateAsset>[1] }) =>
      updateAsset(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      toast.success('Asset updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update asset');
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version }: { id: number; version: number }) => deleteAsset(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('Asset deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete asset');
    },
  });
}

// --- Categories ---

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.categories() });
      toast.success('Category created');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.categories() });
      toast.success('Category updated');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.categories() });
      toast.success('Category deleted');
    },
    onError: (err) => toast.error(err.message),
  });
}

// --- Locations ---

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.locations() });
      toast.success('Location created');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateLocation(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.locations() });
      toast.success('Location updated');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.locations() });
      toast.success('Location deleted');
    },
    onError: (err) => toast.error(err.message),
  });
}

// --- Departments ---

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.departments() });
      toast.success('Department created');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateDepartment(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.departments() });
      toast.success('Department updated');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.departments() });
      toast.success('Department deleted');
    },
    onError: (err) => toast.error(err.message),
  });
}
