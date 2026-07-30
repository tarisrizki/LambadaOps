'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignTicketSchema, type AssignTicketInput } from '../schemas';
import { useAssignTicket } from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function AssignTicketDialog({ ticketId, currentVersion }: { ticketId: number; currentVersion: number }) {
  const [open, setOpen] = useState(false);
  const mutation = useAssignTicket();

  const form = useForm<AssignTicketInput>({
    resolver: zodResolver(assignTicketSchema) as unknown as Resolver<AssignTicketInput>,
    defaultValues: {
      assignedToId: 0,
      version: currentVersion,
    },
  });

  // Update version in form if currentVersion prop changes from external fetch
  if (form.getValues('version') !== currentVersion) {
    form.setValue('version', currentVersion);
  }

  // Fetch users for the dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users', 'reference'],
    queryFn: async () => {
      const res = await api.api.reference.users.$get();
      const json = await res.json();
      return json.data;
    },
  });

  const onSubmit = (data: AssignTicketInput) => {
    mutation.mutate(
      { id: ticketId, payload: data },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Assign
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            Assign this ticket to a technician.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="assignedToId">Technician</Label>
            <Select
              onValueChange={(val) => form.setValue('assignedToId', Number(val))}
            >
              <SelectTrigger id="assignedToId" className={form.formState.errors.assignedToId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select Technician" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u: { id: number; name: string }) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.assignedToId && (
              <p className="text-sm text-red-500">{form.formState.errors.assignedToId.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Assigning...' : 'Assign Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
