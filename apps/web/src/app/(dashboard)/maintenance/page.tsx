'use client';

import { useQuery } from '@tanstack/react-query';
import { maintenanceQueries } from '@/features/maintenance/api/queries';
import { MaintenanceTable } from '@/features/maintenance/components/maintenance-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function MaintenancePage() {
  const { data: jobs, isLoading } = useQuery(maintenanceQueries.list());

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Maintenance</h2>
        <div className="flex items-center space-x-2">
          <Link href="/maintenance/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Schedule Job
            </Button>
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <p className="text-muted-foreground">Loading maintenance jobs...</p>
        </div>
      ) : (
        <MaintenanceTable jobs={jobs || []} />
      )}
    </div>
  );
}
