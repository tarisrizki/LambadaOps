'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Ticket } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueries } from '../api/queries';

interface ActivityItem {
  id: number;
  actorNameSnapshot: string;
  eventType: string;
  assetId: number;
  createdAt: string;
}

export function DashboardHome() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const { data: summary, isLoading } = useQuery(dashboardQueries.summary());

  if (!mounted || isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-8 pt-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Welcome & Quick Actions */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Welcome back, {user?.name || 'User'}!</CardTitle>
            <CardDescription>
              Here is what&apos;s happening with your workspace today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h4 className="text-sm font-semibold mb-2">Workspace Information</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Tenant ID: {user?.tenantId}</p>
                <p>Role Level: {user?.roleId}</p>
                <p>Email: {user?.email}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">
                <Ticket className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="col-span-3 overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest asset actions in your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[250px]">
            {summary?.recentActivity?.length > 0 ? (
              <div className="space-y-4">
                {summary.recentActivity.map((activity: ActivityItem) => (
                  <div key={activity.id} className="flex items-start space-x-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{activity.actorNameSnapshot}</p>
                      <p className="text-muted-foreground">{activity.eventType} on Asset #{activity.assetId}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <BellIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-medium mb-1">No recent activity</h3>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Assets" value={summary?.totalAssets?.toString() || '0'} description="Active and retired items" />
        <MetricCard title="Unassigned Assets" value={summary?.unassignedAssets?.toString() || '0'} description="Available for checkout" />
        <MetricCard title="Broken Assets" value={summary?.assetsInRepair?.toString() || '0'} description="Currently under maintenance" />
        <MetricCard title="Active Tickets" value={summary?.activeTickets?.toString() || '0'} description="Open or in-progress issues" />
      </div>
    </div>
  );
}

const MetricCard = memo(function MetricCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
});

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
