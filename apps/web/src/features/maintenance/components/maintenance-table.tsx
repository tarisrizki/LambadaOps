'use client';

import { Eye } from 'lucide-react';
import Link from 'next/link';
import { MaintenanceStatusBadge } from './maintenance-status-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MaintenanceJob {
  id: number;
  title: string;
  status: string;
  scheduledDate: string | null;
  createdAt: string;
  assetId: number;
}

interface MaintenanceTableProps {
  jobs: MaintenanceJob[];
}

export function MaintenanceTable({ jobs }: MaintenanceTableProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">No maintenance jobs found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">#{job.id}</TableCell>
              <TableCell>{job.title}</TableCell>
              <TableCell>
                <MaintenanceStatusBadge status={job.status} />
              </TableCell>
              <TableCell>
                {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Link href={`/maintenance/${job.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                    <span className="sr-only">View</span>
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
