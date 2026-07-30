'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { AssetStatusBadge } from './asset-status-badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import type { getAssets } from '../api/client';

export type Asset = Awaited<ReturnType<typeof getAssets>>[number];

export function AssetTable({ data, onDeleteClick }: { data: Asset[]; onDeleteClick: (asset: Asset) => void }) {
  const router = useRouter();
  const columns = useMemo<ColumnDef<Asset>[]>(
    () => [
      {
        accessorKey: 'assetCode',
        header: 'Code',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.assetCode}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <AssetStatusBadge status={row.original.status as "active" | "repair" | "lost" | "retired" | "disposed"} />,
      },
      {
        accessorKey: 'condition',
        header: 'Condition',
        cell: ({ row }) => <span className="capitalize">{row.original.condition}</span>,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const asset = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 outline-none ring-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/assets/${asset.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/assets/${asset.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Asset
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteClick(asset)} className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Asset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onDeleteClick, router]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md border-dashed">
        <h3 className="mt-4 text-lg font-semibold">No assets found</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          You haven&apos;t added any assets yet, or no assets match your search.
        </p>
        <Button onClick={() => router.push('/assets/new')}>
          Create Asset
        </Button>
      </div>
    );
  }

  return <DataTable columns={columns} data={data} />;
}
