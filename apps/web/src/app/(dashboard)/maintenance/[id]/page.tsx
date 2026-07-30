'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { maintenanceQueries } from '@/features/maintenance/api/queries';
import { MaintenanceDetail } from '@/features/maintenance/components/maintenance-detail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : 0;

  const { data: job, isLoading, error } = useQuery(maintenanceQueries.detail(id));

  if (isLoading) {
    return (
      <div className="flex-1 p-8 pt-6 flex justify-center">
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex-1 p-8 pt-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="text-center py-10">
          <p className="text-red-500">Failed to load maintenance job or it does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <MaintenanceDetail job={job} />
    </div>
  );
}
