'use client';

import { useState } from 'react';
import { ImportStatusBadge } from './import-status-badge';
import { ImportResultDialog } from './import-result-dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ImportJob } from '../schemas';

interface ImportHistoryTableProps {
  jobs: ImportJob[];
}

export function ImportHistoryTable({ jobs }: ImportHistoryTableProps) {
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">No import history found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Results</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              // Extract original filename safely if using UUID format
              const originalName = job.filePath.split('-').slice(5).join('-') || job.filePath.split('/').pop() || job.filePath;
              
              return (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">#{job.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={originalName}>
                    {originalName}
                  </TableCell>
                  <TableCell>
                    <ImportStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    {job.totalRows !== null ? (
                      <span className="text-sm">
                        <span className="text-green-600 font-medium">{job.successRows || 0}</span>
                        <span className="mx-1">/</span>
                        <span className="text-red-600 font-medium">{job.failedRows || 0}</span>
                        <span className="mx-1">/</span>
                        <span className="text-muted-foreground">{job.totalRows}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedJob(job)}
                      disabled={job.status === 'pending' || job.status === 'processing'}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="sr-only">View Results</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedJob && (
        <ImportResultDialog 
          job={selectedJob} 
          open={!!selectedJob} 
          onOpenChange={(open) => {
            if (!open) setSelectedJob(null);
          }} 
        />
      )}
    </>
  );
}
