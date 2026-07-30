'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationQueries } from '../api/queries';
import { NotificationBadge } from './notification-badge';
import { NotificationList } from './notification-list';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/providers/auth-provider';

export function NotificationDropdown() {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useQuery({
    ...notificationQueries.unread(),
    enabled: !!user,
  });

  const unreadCount = notifications?.length || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none ring-0">
        <NotificationBadge count={unreadCount} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <DropdownMenuLabel className="font-normal flex items-center justify-between p-4">
          <span className="font-semibold tracking-tight">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
              {unreadCount} New
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <NotificationList notifications={notifications || []} isLoading={isLoading} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
