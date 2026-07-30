'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteAsset } from '../api/mutations';

import type { Asset } from './asset-table';

type AssetDeleteDialogProps = {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
};

export function AssetDeleteDialog({ asset, isOpen, onClose }: AssetDeleteDialogProps) {
  const deleteMutation = useDeleteAsset();

  const handleConfirm = () => {
    if (asset) {
      deleteMutation.mutate(
        { id: asset.id, version: asset.version },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This will soft-delete the asset <strong>{asset?.name}</strong> (Code: {asset?.assetCode}). 
            It will no longer appear in standard reports or listings.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>Cancel</Button>
          <Button 
            onClick={(e: React.MouseEvent) => { e.preventDefault(); handleConfirm(); }} 
            variant="destructive"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
