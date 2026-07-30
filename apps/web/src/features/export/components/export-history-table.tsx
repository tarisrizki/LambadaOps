'use client';

import { ExportStatusBadge } from './export-status-badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ExportJob } from '../schemas';

interface ExportHistoryTableProps {
  jobs: ExportJob[];
}

export function ExportHistoryTable({ jobs }: ExportHistoryTableProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">No export history found.</p>
      </div>
    );
  }

  const handleDownload = (id: number) => {
    // Navigate directly to the backend route allowing the browser to download the file
    // Assumes backend runs on /api locally. We construct the URL dynamically.
    const url = `/api/export/${id}/download`;
    window.open(url, '_blank');
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium capitalize">{job.entityType}</TableCell>
              <TableCell>
                <ExportStatusBadge status={job.status} />
              </TableCell>
              <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                {job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDownload(job.id)}
                  disabled={job.status !== 'completed'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
