'use client';

import { useQuery } from '@tanstack/react-query';
import { assignmentQueries } from '@/features/assignments/api/queries';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssignmentTypeBadge } from '@/features/assignments/components/assignment-type-badge';
import { use } from 'react';

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: paramId } = use(params);
  const id = parseInt(paramId, 10);

  const { data: assignment, isLoading } = useQuery(assignmentQueries.detail(id));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!assignment) {
    return <div>Assignment not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/assignments')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Assignment Detail</h1>
        </div>
        <Button onClick={() => router.push(`/assignments/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Assignment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Asset</div>
              <div className="font-medium">{assignment.asset.name}</div>
              <div className="text-sm">{assignment.asset.assetCode}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Assignment Type</div>
              <div className="mt-1">
                <AssignmentTypeBadge type={assignment.assignment.assignmentType} />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="mt-1 font-medium">
                {assignment.assignment.returnedAt 
                  ? <span className="text-muted-foreground">Returned</span> 
                  : <span className="text-green-600">Active</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.assignment.assignmentType === 'individual' && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Assigned User</div>
                <div className="font-medium">{assignment.user?.name || 'N/A'}</div>
                <div className="text-sm">{assignment.user?.email}</div>
              </div>
            )}
            {assignment.assignment.assignmentType === 'shared' && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Assigned Department</div>
                <div className="font-medium">{assignment.department?.name || 'N/A'}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground">Assigned At</div>
              <div>{new Date(assignment.assignment.assignedAt).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>
            </div>
            {assignment.assignment.returnedAt && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Returned At</div>
                <div>{new Date(assignment.assignment.returnedAt).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created By</div>
              <div>{assignment.createdBy.name}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
