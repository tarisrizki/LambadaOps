'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { returnAssetSchema, type ReturnAssetInput } from '../schemas';
import { useReturnAsset } from '../api/mutations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';

type ReturnAssetDialogProps = {
  assetId: number;
  version: number;
  isOpen: boolean;
  onClose: () => void;
};

export function ReturnAssetDialog({ assetId, version, isOpen, onClose }: ReturnAssetDialogProps) {
  const mutation = useReturnAsset();
  
  const form = useForm<ReturnAssetInput>({
    resolver: zodResolver(returnAssetSchema) as unknown as Resolver<ReturnAssetInput>,
    defaultValues: {
      version,
      note: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ version, note: '' });
    }
  }, [isOpen, version, form]);

  const { formState: { errors } } = form;

  const onSubmit = (data: ReturnAssetInput) => {
    mutation.mutate({ assetId, payload: data }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Condition Note (Optional)</Label>
            <Textarea
              id="note"
              {...form.register('note')}
              placeholder="Record any damage or relevant notes upon return..."
              className={errors.note ? 'border-red-500' : ''}
            />
            {errors.note && <p className="text-sm text-red-500">{errors.note.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Returning...' : 'Return Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
