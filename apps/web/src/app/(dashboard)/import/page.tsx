'use client';

import { useQuery } from '@tanstack/react-query';
import { importQueries } from '@/features/import/api/queries';
import { ImportUploadCard } from '@/features/import/components/import-upload-card';
import { ImportHistoryTable } from '@/features/import/components/import-history-table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { importKeys } from '@/features/import/api/query-keys';

export default function ImportPage() {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading, isRefetching } = useQuery(importQueries.list());

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: importKeys.lists() });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Excel Import</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ImportUploadCard />
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold tracking-tight">Import History</h3>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10 border rounded-md">
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : (
            <ImportHistoryTable jobs={jobs || []} />
          )}
        </div>
      </div>
    </div>
  );
}
