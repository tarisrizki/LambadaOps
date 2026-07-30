'use client';

import { useForm, type Resolver, type SubmitHandler, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { createAssetSchema, updateAssetSchema, CreateAssetInput } from '../schemas';
import { assetQueries } from '../api/queries';
import { useCreateAsset, useUpdateAsset } from '../api/mutations';

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

type AssetFormProps = {
  initialData?: Asset;
  assetId?: number;
};

export type AssetFormValues = CreateAssetInput & { version?: number };

export function AssetForm({ initialData, assetId }: AssetFormProps) {
  const router = useRouter();
  const isEdit = !!assetId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = (isEdit ? updateAssetSchema : createAssetSchema) as any;
  
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<AssetFormValues>,
    defaultValues: initialData ? {
      name: initialData.name,
      status: initialData.status,
      condition: initialData.condition,
      categoryId: initialData.categoryId ?? 0,
      locationId: initialData.locationId ?? 0,
      departmentId: initialData.departmentId ?? 0,
      purchaseDate: initialData.purchaseDate ?? '',
      purchasePrice: initialData.purchasePrice ?? '',
      serialNumber: initialData.serialNumber ?? '',
      brand: initialData.brand ?? '',
      warrantyExpiry: (initialData as AssetFormValues).warrantyExpiry ?? '',
      version: initialData.version,
    } : {
      name: '',
      status: 'active',
      condition: 'good',
      categoryId: 0,
      locationId: 0,
      departmentId: 0,
      purchaseDate: '',
      purchasePrice: '',
      serialNumber: '',
      brand: '',
      warrantyExpiry: '',
      version: 0,
    },
  });

  const { data: categories, isLoading: loadingCat } = useQuery(assetQueries.categories());
  const { data: locations, isLoading: loadingLoc } = useQuery(assetQueries.locations());
  const { data: departments, isLoading: loadingDep } = useQuery(assetQueries.departments());

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: AssetFormValues) => {
    const payload = { ...values };

    if (isEdit) {
      updateMutation.mutate(
        { id: assetId, payload: { ...payload, version: initialData?.version || 0 } },
        {
          onSuccess: () => router.push(`/assets/${assetId}`),
        }
      );
    } else {
      createMutation.mutate(payload as CreateAssetInput, {
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
              <p className="text-sm text-destructive">{form.formState.errors.name.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                disabled={loadingCat || isPending}
                onValueChange={(val) => form.setValue('categoryId', Number(val))}
                defaultValue={initialData?.categoryId?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c: { id: number; name: string }) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-destructive">{form.formState.errors.categoryId.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Select
                disabled={loadingLoc || isPending}
                onValueChange={(val) => form.setValue('locationId', Number(val))}
                defaultValue={initialData?.locationId?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((l: { id: number; name: string }) => (
                    <SelectItem key={l.id} value={l.id.toString()}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.locationId && (
                <p className="text-sm text-destructive">{form.formState.errors.locationId.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                disabled={loadingDep || isPending}
                onValueChange={(val) => form.setValue('departmentId', Number(val))}
                defaultValue={initialData?.departmentId?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d: { id: number; name: string }) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.departmentId && (
                <p className="text-sm text-destructive">{form.formState.errors.departmentId.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                disabled={isPending}
                onValueChange={(val) => form.setValue('status', val as NonNullable<AssetFormValues['status']>)}
                defaultValue={initialData?.status || 'active'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="repair">In Repair</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <Select
                disabled={isPending}
                onValueChange={(val) => form.setValue('condition', val as NonNullable<AssetFormValues['condition']>)}
                defaultValue={initialData?.condition || 'good'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
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
