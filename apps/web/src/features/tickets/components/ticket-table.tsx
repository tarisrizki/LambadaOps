'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TicketStatusBadge } from './ticket-status-badge';
import { TicketPriorityBadge } from './ticket-priority-badge';
import { buttonVariants } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

type Ticket = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  creatorName?: string;
  assigneeName?: string;
};

type TicketTableProps = {
  tickets: Ticket[];
};

export function TicketTable({ tickets }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-card">
        <p className="text-muted-foreground mb-4">No tickets found.</p>
        <Link href="/tickets/new" className={buttonVariants({ variant: 'default' })}>
          Create Ticket
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">#{ticket.id}</TableCell>
              <TableCell>{ticket.title}</TableCell>
              <TableCell className="capitalize">{ticket.category}</TableCell>
              <TableCell>
                <TicketPriorityBadge priority={ticket.priority} />
              </TableCell>
              <TableCell>
                <TicketStatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>{ticket.assigneeName || '-'}</TableCell>
              <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Link href={`/tickets/${ticket.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View</span>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
