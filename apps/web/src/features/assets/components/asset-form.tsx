'use client';

import { useForm, type Resolver, type SubmitHandler, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { createAssetSchema, updateAssetSchema, CreateAssetInput, UpdateAssetInput } from '../schemas';
import { assetQueries } from '../api/queries';
import { useCreateAsset, useUpdateAsset } from '../api/mutations';
import { Skeleton } from '@/components/ui/skeleton';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import type { Asset } from './asset-table';

// ─── Types ─────────────────────────────────────────────────────────────────────

type CreateMode = { mode: 'create' };
type EditMode = { mode: 'edit'; assetId: number; initialData: Asset };
type AssetFormMode = CreateMode | EditMode;

type AssetFormProps = AssetFormMode;

type CreateAssetFormValues = CreateAssetInput;
type EditAssetFormValues = UpdateAssetInput & { version?: number };

// ─── Schema Resolution ─────────────────────────────────────────────────────────

function getSchema(mode: 'create' | 'edit') {
  return mode === 'create' ? createAssetSchema : updateAssetSchema;
}

function getResolver(mode: 'create' | 'edit'): Resolver<CreateAssetFormValues | EditAssetFormValues> {
  const schema = getSchema(mode);
  return zodResolver(schema) as unknown as Resolver<CreateAssetFormValues | EditAssetFormValues>;
}

function getDefaultValues(props: AssetFormProps) {
  if (props.mode === 'create') {
    return {
      name: '',
      status: 'active' as const,
      condition: 'good' as const,
      categoryId: 0,
      locationId: 0,
      departmentId: 0,
      purchaseDate: '',
      purchasePrice: '',
      serialNumber: '',
      brand: '',
      warrantyExpiry: '',
    };
  }
  return {
    name: props.initialData.name,
    status: props.initialData.status,
    condition: props.initialData.condition,
    categoryId: props.initialData.categoryId ?? 0,
    locationId: props.initialData.locationId ?? 0,
    departmentId: props.initialData.departmentId ?? 0,
    purchaseDate: props.initialData.purchaseDate ?? '',
    purchasePrice: props.initialData.purchasePrice ?? '',
    serialNumber: props.initialData.serialNumber ?? '',
    brand: props.initialData.brand ?? '',
    warrantyExpiry: (props.initialData as CreateAssetFormValues).warrantyExpiry ?? '',
    version: props.initialData.version,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssetForm(props: AssetFormProps) {
  const router = useRouter();
  const isEdit = props.mode === 'edit';

  const form = useForm<CreateAssetFormValues | EditAssetFormValues>({
    resolver: getResolver(isEdit ? 'edit' : 'create'),
    defaultValues: getDefaultValues(props),
  });

  const { data: categories, isLoading: loadingCat } = useQuery(assetQueries.categories());
  const { data: locations, isLoading: loadingLoc } = useQuery(assetQueries.locations());
  const { data: departments, isLoading: loadingDep } = useQuery(assetQueries.departments());

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: CreateAssetFormValues | EditAssetFormValues) => {
    if (isEdit) {
      updateMutation.mutate(
        { id: props.assetId, payload: { ...values, version: props.initialData?.version || 0 } as UpdateAssetInput },
        { onSuccess: () => router.push(`/assets/${props.assetId}`) }
      );
    } else {
      createMutation.mutate(values as CreateAssetInput, {
        onSuccess: (data) => router.push(`/assets/${data.id}`),
      });
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Asset' : 'Create Asset'}</CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit as unknown as SubmitHandler<FieldValues>)} className="space-y-8">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name *</Label>
            <Input id="name" {...form.register('name')} placeholder="MacBook Pro M2" disabled={isPending} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{String(form.formState.errors.name.message)}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              {loadingCat ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  disabled={isPending}
                  onValueChange={(val) => form.setValue('categoryId', Number(val))}
                  value={form.watch('categoryId') ? String(form.watch('categoryId')) : undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c: { id: number; name: string }) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {form.formState.errors.categoryId && (
                <p className="text-sm text-destructive">{String(form.formState.errors.categoryId.message)}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location *</Label>
              {loadingLoc ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  disabled={isPending}
                  onValueChange={(val) => form.setValue('locationId', Number(val))}
                  value={form.watch('locationId') ? String(form.watch('locationId')) : undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((l: { id: number; name: string }) => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {form.formState.errors.locationId && (
                <p className="text-sm text-destructive">{String(form.formState.errors.locationId.message)}</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>Department *</Label>
              {loadingDep ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  disabled={isPending}
                  onValueChange={(val) => form.setValue('departmentId', Number(val))}
                  value={form.watch('departmentId') ? String(form.watch('departmentId')) : undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((d: { id: number; name: string }) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {form.formState.errors.departmentId && (
                <p className="text-sm text-destructive">{String(form.formState.errors.departmentId.message)}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                disabled={isPending}
                onValueChange={(val) => form.setValue('status', val as 'active' | 'repair' | 'lost' | 'retired' | 'disposed')}
                value={String(form.watch('status') || '')}
              >
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="repair">In Repair</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select
                disabled={isPending}
                onValueChange={(val) => form.setValue('condition', val as 'good' | 'fair' | 'poor')}
                value={String(form.watch('condition') || '')}
              >
                <SelectTrigger><SelectValue placeholder="Select Condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...form.register('brand')} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" {...form.register('serialNumber')} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" type="date" {...form.register('purchaseDate')} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input id="purchasePrice" type="number" step="0.01" {...form.register('purchasePrice')} disabled={isPending} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Asset'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
