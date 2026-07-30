'use client';

import { useQuery } from '@tanstack/react-query';
import { exportQueries } from '@/features/export/api/queries';
import { ExportCard } from '@/features/export/components/export-card';
import { ExportHistoryTable } from '@/features/export/components/export-history-table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { exportKeys } from '@/features/export/api/query-keys';

export default function ExportPage() {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading, isRefetching } = useQuery(exportQueries.recent());

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: exportKeys.recent() });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">CSV Export</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ExportCard />
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold tracking-tight">Recent Exports</h3>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10 border rounded-md">
              <p className="text-muted-foreground">Loading recent exports...</p>
            </div>
          ) : (
            <ExportHistoryTable jobs={jobs || []} />
          )}
        </div>
      </div>
    </div>
  );
}
