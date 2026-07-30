'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetQueries } from '@/features/assets/api/queries';
import { AssetTable } from '@/features/assets/components/asset-table';
import { useRouter } from 'next/navigation';
import { AssetDeleteDialog } from '@/features/assets/components/asset-delete-dialog';
import type { Asset } from '@/features/assets/components/asset-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

export default function AssetsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const { data: assets, isLoading } = useQuery(assetQueries.list(search));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
        <Button onClick={() => router.push('/assets/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Asset
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search assets by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
        </div>
      ) : (
        <AssetTable data={assets || []} onDeleteClick={setAssetToDelete} />
      )}

      <AssetDeleteDialog
        asset={assetToDelete}
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
      />
    </div>
  );
}
