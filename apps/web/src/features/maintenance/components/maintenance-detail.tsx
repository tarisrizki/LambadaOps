'use client';

import { MaintenanceStatusBadge } from './maintenance-status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import {
  useStartMaintenance,
  usePauseMaintenance,
  useResumeMaintenance,
  useCompleteMaintenance,
  useCancelMaintenance,
} from '../api/mutations';

interface MaintenanceDetailProps {
  job: {
    id: number;
    version: number;
    title: string;
    status: string;
    description?: string | null;
    assetId: number;
    scheduledDate?: string | null;
    createdAt: string;
    notes?: { id: number; createdAt: string; note: string }[];
  };
}

export function MaintenanceDetail({ job }: MaintenanceDetailProps) {
  const startMutation = useStartMaintenance();
  const pauseMutation = usePauseMaintenance();
  const resumeMutation = useResumeMaintenance();
  const completeMutation = useCompleteMaintenance();
  const cancelMutation = useCancelMaintenance();

  const isPending =
    startMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending;

  const handleAction = (action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel') => {
    const payload = { id: job.id, version: job.version, note: `Job ${action}d via dashboard.` };
    switch (action) {
      case 'start':
        startMutation.mutate(payload);
        break;
      case 'pause':
        pauseMutation.mutate(payload);
        break;
      case 'resume':
        resumeMutation.mutate(payload);
        break;
      case 'complete':
        completeMutation.mutate(payload);
        break;
      case 'cancel':
        if (confirm('Are you sure you want to cancel this maintenance job?')) {
          cancelMutation.mutate(payload);
        }
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{job.title}</h2>
          <p className="text-muted-foreground">Maintenance Job #{job.id}</p>
        </div>
        <MaintenanceStatusBadge status={job.status} className="text-sm px-3 py-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {job.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Asset ID</h4>
                  <p className="mt-1">{job.assetId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Scheduled Date</h4>
                  <p className="mt-1">
                    {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Created At</h4>
                  <p className="mt-1">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MVP excludes parts and costs, so we only show notes/history if any */}
          {job.notes && job.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.notes.map((note: { id: number; createdAt: string; note: string }) => (
                    <div key={note.id} className="text-sm border-l-2 border-primary pl-4 py-1">
                      <p className="text-muted-foreground mb-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                      <p>{note.note}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Update job status</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              {(job.status === 'scheduled' || job.status === 'ready') && (
                <Button
                  onClick={() => handleAction('start')}
                  disabled={isPending}
                  className="w-full justify-start"
                >
                  <Play className="w-4 h-4 mr-2" /> Start Maintenance
                </Button>
              )}
              {job.status === 'in_progress' && (
                <Button
                  onClick={() => handleAction('pause')}
                  disabled={isPending}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </Button>
              )}
              {job.status === 'paused' && (
                <Button
                  onClick={() => handleAction('resume')}
                  disabled={isPending}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Resume
                </Button>
              )}
              {(job.status === 'in_progress' || job.status === 'paused') && (
                <Button
                  onClick={() => handleAction('complete')}
                  disabled={isPending}
                  variant="default"
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Completed
                </Button>
              )}
              {job.status !== 'completed' && job.status !== 'cancelled' && (
                <Button
                  onClick={() => handleAction('cancel')}
                  disabled={isPending}
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 mt-4"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Cancel Job
                </Button>
              )}
              
              {job.status === 'completed' && (
                <p className="text-sm text-center text-muted-foreground italic py-2">
                  This job is completed.
                </p>
              )}
              {job.status === 'cancelled' && (
                <p className="text-sm text-center text-muted-foreground italic py-2">
                  This job was cancelled.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
