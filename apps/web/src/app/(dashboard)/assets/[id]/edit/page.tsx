'use client';

import { AssetForm } from '@/features/assets/components/asset-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { assetQueries } from '@/features/assets/api/queries';

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: paramId } = use(params);
  const id = parseInt(paramId, 10);

  const { data: asset, isLoading, isError } = useQuery(assetQueries.detail(id));

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
        <div className="h-8 w-1/3 bg-muted rounded"></div>
        <div className="h-96 w-full bg-muted rounded"></div>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-xl font-semibold">Asset not found or error loading</h2>
        <Button variant="link" onClick={() => router.push('/assets')}>
          Return to assets
        </Button>
      </div>
    );
  }

  // Pre-process date fields if they contain timestamps, or handle nulls
  const initialData = {
    ...asset,
    purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
    warrantyExpiry: asset.warrantyEnd ? asset.warrantyEnd.split('T')[0] : '',
    purchasePrice: asset.purchasePrice?.toString() || '',
    brand: asset.brand || '',
    serialNumber: asset.serialNumber || '',
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/assets/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Asset</h1>
      </div>
      <AssetForm initialData={initialData} assetId={id} />
    </div>
  );
}
