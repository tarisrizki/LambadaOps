'use client';

import { useQuery } from '@tanstack/react-query';
import { assetQueries } from '@/features/assets/api/queries';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { AssetStatusBadge } from '@/features/assets/components/asset-status-badge';
import { AlertCircle, QrCode, Plus } from 'lucide-react';
import Link from 'next/link';

export default function QRScanPage() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : Array.isArray(params.token) ? params.token[0] : '';

  const { data: asset, isLoading, error } = useQuery(assetQueries.scan(token));

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-lg mx-auto">
        <Card className="border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invalid or Missing Asset</CardTitle>
            <CardDescription>
              The QR code you scanned does not match any active asset in the system.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/assets" className={buttonVariants({ variant: 'outline' })}>
              Return to Dashboard
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-lg mx-auto">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Asset Found</CardTitle>
          <CardDescription>You scanned the following asset.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Asset Name</p>
                <p className="text-base font-semibold">{asset.name}</p>
              </div>
              <AssetStatusBadge status={asset.status} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Asset Code</p>
                <p className="text-sm">{asset.assetCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brand</p>
                <p className="text-sm">{asset.brand || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                <p className="text-sm">{asset.serialNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Condition</p>
                <p className="text-sm capitalize">{asset.condition || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link 
            href={`/tickets/new?assetId=${asset.id}`} 
            className={buttonVariants({ variant: 'default', className: 'w-full' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Link>
          <Link 
            href={`/assets/${asset.id}`} 
            className={buttonVariants({ variant: 'outline', className: 'w-full' })}
          >
            View Full Details
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
