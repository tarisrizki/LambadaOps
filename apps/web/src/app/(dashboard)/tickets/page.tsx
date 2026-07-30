'use client';

import { useQuery } from '@tanstack/react-query';
import { ticketQueries } from '@/features/tickets/api/queries';
import { TicketTable } from '@/features/tickets/components/ticket-table';
import { buttonVariants } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function TicketsPage() {
  const { data: tickets, isLoading, isError } = useQuery(ticketQueries.list());

  if (isLoading) {
    return <div className="p-8">Loading tickets...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Failed to load tickets.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
        <div className="flex items-center space-x-2">
          <Link href="/tickets/new" className={buttonVariants({ variant: 'default' })}>
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Link>
        </div>
      </div>
      <TicketTable tickets={tickets || []} />
    </div>
  );
}
