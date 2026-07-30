'use client';

import { useQuery } from '@tanstack/react-query';
import { ticketQueries } from '@/features/tickets/api/queries';
import { TicketDetail } from '@/features/tickets/components/ticket-detail';
import { TicketCommentList } from '@/features/tickets/components/ticket-comment-list';
import { TicketCommentForm } from '@/features/tickets/components/ticket-comment-form';
import { AssignTicketDialog } from '@/features/tickets/components/assign-ticket-dialog';
import { UpdateTicketStatusDialog } from '@/features/tickets/components/update-ticket-status-dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { SystemRoles } from '@/lib/roles';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = parseInt(params.id as string, 10);
  const { user } = useAuth();

  const { data: ticket, isLoading, isError } = useQuery(ticketQueries.detail(ticketId));

  if (isLoading) {
    return <div className="p-8">Loading ticket details...</div>;
  }

  if (isError || !ticket) {
    return <div className="p-8 text-red-500">Failed to load ticket details or ticket not found.</div>;
  }

  const canAssign = user?.roleId === SystemRoles.OWNER_ADMIN || user?.roleId === SystemRoles.IT_MANAGER;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/tickets" className={`${buttonVariants({ variant: 'ghost' })} mb-2 -ml-4`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tickets
        </Link>
        <div className="flex gap-2">
          {canAssign && (
            <AssignTicketDialog ticketId={ticket.id} currentVersion={ticket.version} />
          )}
          <UpdateTicketStatusDialog 
            ticketId={ticket.id} 
            currentStatus={ticket.status} 
            currentVersion={ticket.version} 
          />
        </div>
      </div>

      <TicketDetail ticket={ticket} />

      <div className="grid grid-cols-1 gap-6">
        <TicketCommentList comments={ticket.comments || []} />
        <TicketCommentForm ticketId={ticket.id} />
      </div>
    </div>
  );
}
