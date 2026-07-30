import { useMarkAsRead } from '../api/mutations';
import { Info, AlertTriangle, AlertCircle, Wrench, Package } from 'lucide-react';
import type { Notification } from '../schemas';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'maintenance_scheduled':
    case 'maintenance_completed':
      return <Wrench className="h-4 w-4 text-blue-500" />;
    case 'asset_assigned':
    case 'asset_returned':
      return <Package className="h-4 w-4 text-green-500" />;
    case 'ticket_created':
    case 'ticket_assigned':
    case 'ticket_resolved':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'alert':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useMarkAsRead();

  return (
    <div className={`p-4 border-b last:border-0 hover:bg-muted/30 transition-colors flex gap-3 ${!notification.readAt ? 'bg-primary/5' : ''}`}>
      <div className="mt-1 flex-shrink-0">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{notification.title}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
          {!notification.readAt && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 px-2 text-xs text-primary hover:text-primary/80"
              onClick={() => markAsRead.mutate(notification.id)}
              disabled={markAsRead.isPending}
            >
              Mark Read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
