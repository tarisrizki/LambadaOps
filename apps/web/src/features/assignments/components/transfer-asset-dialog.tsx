'use client';

import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transferAssetSchema, type TransferAssetInput } from '../schemas';
import { useTransferAsset } from '../api/mutations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect } from 'react';

type TransferAssetDialogProps = {
  assetId: number;
  version: number;
  isOpen: boolean;
  onClose: () => void;
};

export function TransferAssetDialog({ assetId, version, isOpen, onClose }: TransferAssetDialogProps) {
  const mutation = useTransferAsset();
  
  const form = useForm<TransferAssetInput>({
    resolver: zodResolver(transferAssetSchema) as unknown as Resolver<TransferAssetInput>,
    defaultValues: {
      version,
      assignmentType: 'individual',
      userId: null,
      departmentId: null,
      locationId: null,
      note: '',
    },
  });

  const { formState: { errors }, control } = form;

  const assignmentType = useWatch({ control, name: 'assignmentType' });
  const userIdValue = useWatch({ control, name: 'userId' });
  const departmentIdValue = useWatch({ control, name: 'departmentId' });
  const locationIdValue = useWatch({ control, name: 'locationId' });

  useEffect(() => {
    if (isOpen) {
      form.reset({ version, assignmentType: 'individual', userId: null, departmentId: null, locationId: null, note: '' });
    }
  }, [isOpen, version, form]);

  useEffect(() => {
    if (assignmentType === 'unassigned') {
      form.setValue('userId', null);
      form.setValue('departmentId', null);
      form.setValue('locationId', null);
    } else if (assignmentType === 'individual') {
      form.setValue('departmentId', null);
    } else if (assignmentType === 'shared') {
      form.setValue('userId', null);
    }
  }, [assignmentType, form]);

  type User = { id: number; name: string; email: string };
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['reference', 'users'],
    queryFn: async () => {
      const res = await api.api.reference.users.$get();
      const json = await res.json();
      return json.data as User[];
    },
    enabled: isOpen,
  });

  type Department = { id: number; name: string };
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['reference', 'departments'],
    queryFn: async () => {
      const res = await api.api.reference.departments.$get();
      const json = await res.json();
      return json.data as Department[];
    },
    enabled: isOpen,
  });

  type Location = { id: number; name: string };
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['reference', 'locations'],
    queryFn: async () => {
      const res = await api.api.reference.locations.$get();
      const json = await res.json();
      return json.data as Location[];
    },
    enabled: isOpen,
  });

  const onSubmit = (data: TransferAssetInput) => {
    mutation.mutate({ assetId, payload: data }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Check Out</DialogTitle>
          <DialogDescription>
            Transfer this checked out asset to another user, department, or location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignmentType">Transfer Check Out To Type</Label>
            <Select
              onValueChange={(val) => form.setValue('assignmentType', val as "individual" | "shared" | "unassigned")}
              value={assignmentType}
            >
              <SelectTrigger id="assignmentType">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual (User)</SelectItem>
                <SelectItem value="shared">Shared (Department/Location)</SelectItem>
              </SelectContent>
            </Select>
            {errors.assignmentType && <p className="text-sm text-red-500">{errors.assignmentType.message}</p>}
          </div>

          {assignmentType === 'individual' && (
            <div className="space-y-2">
              <Label htmlFor="userId">Transfer to User</Label>
              <Select
                onValueChange={(val) => form.setValue('userId', Number(val))}
                value={userIdValue ? String(userIdValue) : ""}
              >
                <SelectTrigger id="userId" className={errors.userId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && <p className="text-sm text-red-500">{errors.userId.message}</p>}
            </div>
          )}

          {assignmentType === 'shared' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Transfer to Department</Label>
                <Select
                  onValueChange={(val) => form.setValue('departmentId', val ? Number(val) : null)}
                  value={departmentIdValue ? String(departmentIdValue) : ""}
                >
                  <SelectTrigger id="departmentId" className={errors.departmentId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-sm text-red-500">{errors.departmentId.message}</p>}
              </div>
            </div>
          )}

          {assignmentType !== 'unassigned' && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="locationId">Transfer to Location (Optional for Individual)</Label>
              <Select
                onValueChange={(val) => form.setValue('locationId', val ? Number(val) : null)}
                value={locationIdValue ? String(locationIdValue) : ""}
              >
                <SelectTrigger id="locationId" className={errors.locationId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationId && <p className="text-sm text-red-500">{errors.locationId.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              {...form.register('note')}
              placeholder="Why is this asset being transferred?"
              className={errors.note ? 'border-red-500' : ''}
            />
            {errors.note && <p className="text-sm text-red-500">{errors.note.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Transferring...' : 'Transfer Check Out'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
