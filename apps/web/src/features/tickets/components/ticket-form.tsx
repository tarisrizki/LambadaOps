'use client';

import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTicketSchema, type CreateTicketInput } from '../schemas';
import { useCreateTicket } from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TicketFormProps {
  initialAssetId?: number;
}

export function TicketForm({ initialAssetId }: TicketFormProps) {
  const router = useRouter();
  const mutation = useCreateTicket();

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema) as unknown as Resolver<CreateTicketInput>,
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      assetId: initialAssetId || '',
    },
  });

  const { formState: { errors }, control } = form;

  const categoryValue = useWatch({ control, name: 'category' });
  const priorityValue = useWatch({ control, name: 'priority' });
  const assetIdValue = useWatch({ control, name: 'assetId' });

  // Optional: Fetch assets for the dropdown so user can link ticket to asset
  const { data: assets = [] } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: async () => {
      const res = await api.api.assets.$get();
      const json = await res.json();
      return json.data;
    },
  });

  const onSubmit = (data: CreateTicketInput) => {
    mutation.mutate(data);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Ticket</CardTitle>
        <CardDescription>Report an issue or request a service.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Brief summary of the issue"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Provide detailed information about the issue..."
              className={errors.description ? 'border-red-500 min-h-[100px]' : 'min-h-[100px]'}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(val) => form.setValue('category', String(val))}
                value={categoryValue}
              >
                <SelectTrigger id="category" className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                onValueChange={(val) => form.setValue('priority', val as 'low' | 'medium' | 'high' | 'urgent')}
                value={priorityValue}
              >
                <SelectTrigger id="priority" className={errors.priority ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-red-500">{errors.priority.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetId">Related Asset (Optional)</Label>
            <Select
              onValueChange={(val) => form.setValue('assetId', val === 'none' ? '' : Number(val))}
              value={assetIdValue ? String(assetIdValue) : 'none'}
            >
              <SelectTrigger id="assetId" className={errors.assetId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select Asset (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Asset / N/A</SelectItem>
                {assets.map((asset: { id: number; name: string; assetCode: string }) => (
                  <SelectItem key={asset.id} value={String(asset.id)}>
                    [{asset.assetCode}] {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assetId && <p className="text-sm text-red-500">{errors.assetId.message}</p>}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
