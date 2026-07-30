'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTicketStatusSchema, type UpdateTicketStatusInput } from '../schemas';
import { useUpdateTicketStatus } from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function UpdateTicketStatusDialog({ 
  ticketId, 
  currentStatus, 
  currentVersion 
}: { 
  ticketId: number; 
  currentStatus: string; 
  currentVersion: number 
}) {
  const [open, setOpen] = useState(false);
  const mutation = useUpdateTicketStatus();

  const form = useForm<UpdateTicketStatusInput>({
    resolver: zodResolver(updateTicketStatusSchema) as unknown as Resolver<UpdateTicketStatusInput>,
    defaultValues: {
      status: currentStatus as 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed',
      version: currentVersion,
      comment: '',
    },
  });

  if (form.getValues('version') !== currentVersion) {
    form.setValue('version', currentVersion);
  }

  const onSubmit = (data: UpdateTicketStatusInput) => {
    mutation.mutate(
      { id: ticketId, payload: data },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset({ ...data, comment: '' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        Update Status
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Ticket Status</DialogTitle>
          <DialogDescription>
            Change the status of the ticket and optionally add a comment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              onValueChange={(val) => form.setValue('status', val as 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed')}
              defaultValue={currentStatus}
            >
              <SelectTrigger id="status" className={form.formState.errors.status ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Optional Comment</Label>
            <Textarea
              id="comment"
              {...form.register('comment')}
              placeholder="Reason for status change..."
            />
            {form.formState.errors.comment && (
              <p className="text-sm text-red-500">{form.formState.errors.comment.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
