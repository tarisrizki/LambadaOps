import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketKeys } from './query-keys';
import { createTicket, assignTicket, updateTicketStatus, addTicketComment } from './client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useCreateTicket() {
  const queryClient = useQueryClient();

  const router = useRouter();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      toast('Ticket Created', {
        description: 'The ticket has been created successfully.',
      });
      router.push(`/tickets/${data.id}`);
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.message || 'Failed to create ticket',
      });
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();


  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof assignTicket>[1] }) => assignTicket(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast('Ticket Assigned', {
        description: 'The ticket has been assigned successfully.',
      });
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.message || 'Failed to assign ticket',
      });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();


  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateTicketStatus>[1] }) => updateTicketStatus(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast('Status Updated', {
        description: 'The ticket status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.message || 'Failed to update ticket status',
      });
    },
  });
}

export function useAddTicketComment() {
  const queryClient = useQueryClient();


  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof addTicketComment>[1] }) => addTicketComment(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
      toast('Comment Added', {
        description: 'Your comment has been added successfully.',
      });
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.message || 'Failed to add comment',
      });
    },
  });
}
