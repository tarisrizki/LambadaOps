import { NotificationItem } from './notification-item';
import type { Notification } from '../schemas';
import { BellOff } from 'lucide-react';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
}

export function NotificationList({ notifications, isLoading }: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center space-y-2 h-[300px]">
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center space-y-3 h-[300px]">
        <BellOff className="h-8 w-8 text-muted-foreground/50" />
        <p>You&apos;re all caught up!</p>
        <p className="text-xs">No new notifications</p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
