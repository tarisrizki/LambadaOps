import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  return (
    <div className="relative text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-md">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary" />
      )}
      <span className="sr-only">Notifications</span>
    </div>
  );
}
