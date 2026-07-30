'use client';

import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { scheduleMaintenanceSchema, type ScheduleMaintenanceInput } from '../schemas';
import { useScheduleMaintenance } from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface MaintenanceFormProps {
  initialAssetId?: number;
}

export function MaintenanceForm({ initialAssetId }: MaintenanceFormProps) {
  const router = useRouter();
  const mutation = useScheduleMaintenance();

  const form = useForm<ScheduleMaintenanceInput>({
    resolver: zodResolver(scheduleMaintenanceSchema) as unknown as Resolver<ScheduleMaintenanceInput>,
    defaultValues: {
      title: '',
      description: '',
      assetId: initialAssetId || ('' as unknown as number),
      scheduledDate: '',
    },
  });

  const { formState: { errors }, control } = form;

  const assetIdValue = useWatch({ control, name: 'assetId' });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: async () => {
      const res = await api.api.assets.$get();
      const json = await res.json();
      return json.data;
    },
  });

  const onSubmit = (data: ScheduleMaintenanceInput) => {
    // Convert empty string to undefined for optional date
    if (data.scheduledDate === '') {
      data.scheduledDate = undefined;
    }
    mutation.mutate(data);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Schedule Maintenance</CardTitle>
        <CardDescription>Create a new maintenance job for an asset.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="E.g. Quarterly Inspection"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetId">Related Asset <span className="text-red-500">*</span></Label>
            <Select
              onValueChange={(val) => form.setValue('assetId', Number(val))}
              value={assetIdValue ? String(assetIdValue) : undefined}
            >
              <SelectTrigger id="assetId" className={errors.assetId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset: { id: number; name: string; assetCode: string }) => (
                  <SelectItem key={asset.id} value={String(asset.id)}>
                    [{asset.assetCode}] {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assetId && <p className="text-sm text-red-500">{errors.assetId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Provide detailed instructions or notes..."
              className={errors.description ? 'border-red-500 min-h-[100px]' : 'min-h-[100px]'}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Scheduled Date (Optional)</Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              {...form.register('scheduledDate')}
              className={errors.scheduledDate ? 'border-red-500' : ''}
            />
            {errors.scheduledDate && <p className="text-sm text-red-500">{errors.scheduledDate.message}</p>}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Scheduling...' : 'Schedule Maintenance'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
