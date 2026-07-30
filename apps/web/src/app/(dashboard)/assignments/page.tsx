'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assignmentQueries } from '@/features/assignments/api/queries';
import { AssignmentTable } from '@/features/assignments/components/assignment-table';
import { Input } from '@/components/ui/input';

export default function AssignmentsPage() {
  const [search, setSearch] = useState('');

  const { data: assignments, isLoading } = useQuery(assignmentQueries.list(search));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search assignments by asset or assigned to..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
        </div>
      ) : (
        <AssignmentTable data={assignments || []} />
      )}
    </div>
  );
}
