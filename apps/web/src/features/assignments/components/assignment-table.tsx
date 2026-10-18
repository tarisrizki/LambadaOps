'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { AssignmentTypeBadge } from './assignment-type-badge';

import { MoreHorizontal, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import type { getAssignments } from '../api/client';

export type Assignment = Awaited<ReturnType<typeof getAssignments>>[number];

export function AssignmentTable({ data }: { data: Assignment[] }) {
  const router = useRouter();
  const columns = useMemo<ColumnDef<Assignment>[]>(
    () => [
      {
        accessorKey: 'asset.name',
        header: 'Asset',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.asset?.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.asset?.assetCode}</div>
          </div>
        ),
      },
      {
        accessorKey: 'assignmentType',
        header: 'Check Out Type',
        cell: ({ row }) => <AssignmentTypeBadge type={row.original.assignment.assignmentType} />,
      },
      {
        id: 'assignedTo',
        header: 'Checked Out To',
        cell: ({ row }) => {
          if (row.original.assignment.assignmentType === 'individual') {
            return <span>{row.original.user?.name || 'Unknown User'}</span>;
          }
          if (row.original.assignment.assignmentType === 'shared') {
            if (row.original.department) {
              return <span>{row.original.department.name} (Dept)</span>;
            }
            if (row.original.location) {
              return <span>{row.original.location.name} (Location)</span>;
            }
            return <span>Unknown Shared</span>;
          }
          return <span className="text-muted-foreground italic">None</span>;
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          if (row.original.assignment.returnedAt) {
            return <span className="text-muted-foreground text-sm">Checked In on {new Date(row.original.assignment.returnedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
          }
          return <span className="text-green-600 font-medium text-sm">Active</span>;
        }
      },
      {
        accessorKey: 'assignedAt',
        header: 'Check Out Date',
        cell: ({ row }) => <span className="text-sm">{new Date(row.original.assignment.assignedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const assignment = row.original.assignment;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 outline-none ring-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/assignments/${assignment.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md border-dashed">
        <h3 className="mt-4 text-lg font-semibold">No check-outs found</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          You haven&apos;t created any check-outs yet, or none match your search.
        </p>
      </div>
    );
  }

  return <DataTable columns={columns} data={data} />;
}
