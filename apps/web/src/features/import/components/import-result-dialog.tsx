'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { importQueries } from '../api/queries';
import { ImportStatusBadge } from './import-status-badge';
import type { ImportJob, ImportError } from '../schemas';

interface ImportResultDialogProps {
  job: ImportJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportResultDialog({ job, open, onOpenChange }: ImportResultDialogProps) {
  const { data: errors, isLoading } = useQuery({
    ...importQueries.errors(job.id),
    enabled: open, // Only fetch errors when dialog is open
  });

  const originalName = job.filePath.split('-').slice(5).join('-') || job.filePath.split('/').pop() || job.filePath;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle>Import Results: #{job.id}</DialogTitle>
            <ImportStatusBadge status={job.status} />
          </div>
          <DialogDescription className="truncate" title={originalName}>
            File: {originalName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4 border-y">
          <div className="text-center">
            <p className="text-2xl font-semibold">{job.totalRows || 0}</p>
            <p className="text-sm text-muted-foreground">Total Rows</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-600">{job.successRows || 0}</p>
            <p className="text-sm text-muted-foreground">Successfully Imported</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-red-600">{job.failedRows || 0}</p>
            <p className="text-sm text-muted-foreground">Failed Rows</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading error details...</p>
            </div>
          ) : errors && errors.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Error Log</h4>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium w-24">Row</th>
                      <th className="px-4 py-2 text-left font-medium">Error Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {errors.map((error: ImportError) => (
                      <tr key={error.id}>
                        <td className="px-4 py-2 text-muted-foreground">#{error.rowNumber}</td>
                        <td className="px-4 py-2 text-red-600">{error.errorMessage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : job.failedRows && job.failedRows > 0 ? (
             <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Errors could not be loaded.</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No errors found. All rows imported successfully.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
