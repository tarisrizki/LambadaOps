'use client';

import { useQuery } from '@tanstack/react-query';
import { assetQueries } from '@/features/assets/api/queries';
import { AssetStatusBadge } from '@/features/assets/components/asset-status-badge';
import { AssignAssetDialog } from '@/features/assignments/components/assign-asset-dialog';
import { TransferAssetDialog } from '@/features/assignments/components/transfer-asset-dialog';
import { ReturnAssetDialog } from '@/features/assignments/components/return-asset-dialog';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = parseInt(resolvedParams.id, 10);
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const { data: asset, isLoading, isError, error } = useQuery(assetQueries.detail(id));
  const { data: categories } = useQuery(assetQueries.categories());
  const { data: locations } = useQuery(assetQueries.locations());
  const { data: departments } = useQuery(assetQueries.departments());

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-1/3 bg-muted rounded"></div>
        <Card>
          <CardContent className="h-64"></CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-xl font-semibold">Asset not found or error loading</h2>
        <pre className="text-left text-xs bg-muted text-foreground p-4 mt-4 mb-4 whitespace-pre-wrap">
          Error: {error?.message || 'None'}
          {"\n"}
          Token length: {typeof window !== 'undefined' ? (localStorage.getItem('token')?.length || 0) : 'server'}
        </pre>
        <Button variant="link" onClick={() => router.push('/assets')}>
          Return to assets
        </Button>
      </div>
    );
  }

  const categoryName = categories?.find((c: { id: number; name: string }) => c.id === asset.categoryId)?.name || 'Unknown';
  const locationName = locations?.find((l: { id: number; name: string }) => l.id === asset.locationId)?.name || 'Unknown';
  const departmentName = departments?.find((d: { id: number; name: string }) => d.id === asset.departmentId)?.name || 'Unknown';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/assets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
          <AssetStatusBadge status={asset.status} />
        </div>
        <Button onClick={() => router.push(`/assets/${asset.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Asset Code</p>
              <p className="font-mono">{asset.assetCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p>{categoryName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Condition</p>
              <p className="capitalize">{asset.condition}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Brand</p>
              <p>{asset.brand || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Serial Number</p>
              <p>{asset.serialNumber || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assignment & Location</CardTitle>
            <div className="flex gap-2">
              {asset.assignmentType === 'unassigned' ? (
                <Button size="sm" variant="outline" onClick={() => setIsAssignOpen(true)}>Assign</Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsTransferOpen(true)}>Transfer</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsReturnOpen(true)}>Return</Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p>{locationName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p>{departmentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assignment Type</p>
              <p className="capitalize">{asset.assignmentType}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Purchase Date</p>
              <p>{asset.purchaseDate || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchase Price</p>
              <p>{asset.purchasePrice ? `$${asset.purchasePrice}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warranty Expiry</p>
              <p>{asset.warrantyEnd || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {asset && (
        <>
          <AssignAssetDialog
            assetId={asset.id}
            version={asset.version}
            isOpen={isAssignOpen}
            onClose={() => setIsAssignOpen(false)}
          />
          <TransferAssetDialog
            assetId={asset.id}
            version={asset.version}
            isOpen={isTransferOpen}
            onClose={() => setIsTransferOpen(false)}
          />
          <ReturnAssetDialog
            assetId={asset.id}
            version={asset.version}
            isOpen={isReturnOpen}
            onClose={() => setIsReturnOpen(false)}
          />
        </>
      )}
    </div>
  );
}
